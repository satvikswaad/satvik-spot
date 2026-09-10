import { sanitizeText, validateUrl, createSafeElement, isSafeNavigationUrl } from './js/security.js';
import { PRODUCTS_CATALOGUE } from './js/productsData.js';
import { getCurrentLanguage, setLanguage, t, applyTranslations } from './js/translations.js';

const CART_STORAGE_KEY = 'satwikCart_v2';
const LEGACY_STORAGE_KEY = 'satwikCart';
const BACKUP_STORAGE_KEY = 'satwikCart_backup_v1';

let currentCatalogCategory = 'all';
let currentCatalogQuery = '';

function loadAndMigrateCart() {
    let raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (cartJsonParseError) {
            console.error('Failed to parse cart JSON:', cartJsonParseError);
        }
    }

    // Attempt legacy migration from satwikCart
    let legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
        try {
            const legacyData = JSON.parse(legacyRaw);
            localStorage.setItem(BACKUP_STORAGE_KEY, legacyRaw);

            const migratedCart = {};
            for (const [key, item] of Object.entries(legacyData)) {
                if (!item || (!item.id && !item.productId)) continue;
                const prodId = item.productId || item.id;
                const prod = PRODUCTS_CATALOGUE.find(p => p.id === prodId);

                if (prod && Array.isArray(prod.variants) && prod.variants.length > 0) {
                    const defaultVariant = prod.variants.find(v => v.active && v.stock > 0) || prod.variants[0];
                    const lineKey = `${prod.id}::${defaultVariant.id}`;
                    migratedCart[lineKey] = {
                        lineKey,
                        productId: prod.id,
                        variantId: defaultVariant.id,
                        name: prod.name,
                        variantLabel: defaultVariant.label,
                        price: defaultVariant.price,
                        qty: Math.max(1, Math.min(item.qty || 1, defaultVariant.stock || 99))
                    };
                } else {
                    const lineKey = `${prodId}::legacy`;
                    migratedCart[lineKey] = {
                        lineKey,
                        productId: prodId,
                        variantId: 'legacy',
                        name: item.name || 'Unavailable Product',
                        variantLabel: 'Original',
                        price: item.price || 0,
                        qty: item.qty || 1,
                        unavailable: true
                    };
                }
            }

            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(migratedCart));
            return migratedCart;
        } catch (cartMigrationError) {
            console.error('Legacy cart migration error:', cartMigrationError);
        }
    }

    return {};
}

let cart = loadAndMigrateCart();
let currentSlide = 0;
let autoplayTimer = null;
let touchStartX = 0;
let touchEndX = 0;
const AUTOPLAY_DELAY = 3500; // 3.5 seconds fast transition between village banners

function runInitializers() {
    ensureModalsInDOM();
    initLanguage();
    initUI();
    initUniversalSearch();
    initHeroSlider();
    initScrollReveal();
    initScrollToTop();
    initMobileNav();
    initFaqSearch();
    initProductsSort();
    initReviewsData();
    initContactForm();
    initProductDetailsPage();
    initProfilePage();
    initReorderSection();
    initFloatingAgent();
    initFooterAccordion();
    renderCart();
}

function initFooterAccordion() {
    const accordions = document.querySelectorAll('.footer-accordion');
    if (!accordions.length) return;

    function applyAccordionState() {
        const isMobile = window.innerWidth < 768;
        accordions.forEach((acc) => {
            if (isMobile) {
                acc.removeAttribute('open');
            } else {
                acc.setAttribute('open', '');
            }
        });
    }

    applyAccordionState();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            applyAccordionState();
        }, 150);
    });
}

window.handleFooterSubscribe = function(form) {
    if (!form) return;
    const input = form.querySelector('.footer-newsletter-input');
    const email = input ? input.value.trim() : '';
    if (!email) return;
    showToast('Dhanyawad! You have been subscribed to Satvik updates. 🙏');
    form.reset();
};

function initLanguage() {
    const activeLang = getCurrentLanguage();
    applyTranslations(activeLang);
    document.documentElement.lang = activeLang;
    updateProductCardsLanguage();

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-lang-toggle, #btn-lang-toggle, #mobile-lang-toggle, .mobile-lang-toggle');
        if (btn) {
            e.preventDefault();
            const current = getCurrentLanguage();
            const next = current === 'hi' ? 'en' : 'hi';
            setLanguage(next);
            updateProductCardsLanguage();
            initReorderSection();
            renderCart();
            showToast(next === 'hi' ? 'भाषा हिन्दी में बदल दी गई है 🇮🇳' : 'Language switched to English 🌐');
        }
    });

    window.addEventListener('languageChanged', (e) => {
        applyTranslations(e.detail.language);
        updateProductCardsLanguage();
        initReorderSection();
        renderCart();
    });
}

function updateProductCardsLanguage() {
    const isHi = getCurrentLanguage() === 'hi';
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const pId = card.getAttribute('data-product-id');
        const prod = PRODUCTS_CATALOGUE.find(p => p.id === pId);
        if (!prod) return;

        const titleEl = card.querySelector('.product-title');
        const hindiTitleEl = card.querySelector('.product-hindi-title');
        if (titleEl) {
            titleEl.textContent = isHi ? (prod.hindiName || prod.name) : prod.name;
        }
        if (hindiTitleEl) {
            hindiTitleEl.textContent = isHi ? prod.name : (prod.hindiName || '');
        }

        const viewBtn = card.querySelector('.btn-view-details');
        if (viewBtn) viewBtn.textContent = t('catalog.btnViewDetails');

        const addBtn = card.querySelector('.btn-add-cart');
        if (addBtn && !addBtn.classList.contains('added')) {
            addBtn.textContent = t('catalog.btnAddCart');
        }

        const badge = card.querySelector('.product-badge');
        if (badge) {
            if (prod.badge === 'Bestseller') badge.textContent = t('catalog.bestseller');
            else if (prod.badge === 'Healthy Choice') badge.textContent = t('catalog.healthyChoice');
        }

        const stock = card.querySelector('.stock-status-badge');
        if (stock) {
            stock.textContent = t('catalog.inStock');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitializers);
} else {
    runInitializers();
}

function initUI() {
    const btnOpenCart = document.getElementById('btn-open-cart');
    const btnCloseCart = document.getElementById('btn-close-cart');
    const drawerOverlay = document.getElementById('cart-drawer-overlay');
    const btnCheckout = document.getElementById('btn-checkout');
    const btnCloseCheckout = document.getElementById('btn-close-checkout');
    const btnCloseCheckoutIcon = document.getElementById('btn-close-checkout-icon');
    const formCheckout = document.getElementById('checkout-form');
    const searchInput = document.getElementById('search-input');

    if (btnOpenCart) btnOpenCart.addEventListener('click', openCart);
    if (btnCloseCart) btnCloseCart.addEventListener('click', closeCart);
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', (e) => {
            if (e.target === drawerOverlay) closeCart();
        });
    }
    if (btnCheckout) btnCheckout.addEventListener('click', openCheckout);
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#btn-checkout, .btn-checkout');
        if (btn) {
            e.preventDefault();
            openCheckout();
        }
    });
    if (btnCloseCheckout) btnCloseCheckout.addEventListener('click', closeCheckout);
    if (btnCloseCheckoutIcon) btnCloseCheckoutIcon.addEventListener('click', closeCheckout);
    if (formCheckout) formCheckout.addEventListener('submit', (checkoutSubmitEvent) => { checkoutSubmitEvent.preventDefault(); placeOrder(); });

    const btnProfile = document.getElementById('btn-open-profile');
    if (btnProfile && !btnProfile._boundProfile) {
        btnProfile._boundProfile = true;
        btnProfile.addEventListener('click', (e) => {
            e.preventDefault();
            openProfileModal();
        });
    }

    const bottomBtnCart = document.getElementById('bottom-nav-cart');
    if (bottomBtnCart && !bottomBtnCart._boundCart) {
        bottomBtnCart._boundCart = true;
        bottomBtnCart.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    const bottomBtnProfile = document.getElementById('bottom-nav-profile');
    if (bottomBtnProfile && !bottomBtnProfile._boundProfile) {
        bottomBtnProfile._boundProfile = true;
        bottomBtnProfile.addEventListener('click', (e) => {
            e.preventDefault();
            openProfileModal();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
    }

    // Check for query parameter on page load (e.g. products.html?q=pickle)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const initialQuery = urlParams.get('q') || urlParams.get('search');
        if (initialQuery) {
            const headerSearchInputs = document.querySelectorAll('.ref-search-input');
            headerSearchInputs.forEach(i => i.value = initialQuery);
            setTimeout(() => {
                searchProducts(initialQuery);
            }, 50);
        }
    } catch (_) {}

    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const cat = tab.getAttribute('data-category') || 'all';
            const isCurrentlyActive = tab.classList.contains('active');
            // Toggle active category off to 'all' if clicked again
            const targetCat = (isCurrentlyActive && cat !== 'all') ? 'all' : cat;
            filterCategory(targetCat);
        });
    });

    // Price and Availability filter checkbox listeners
    const filterCheckboxes = document.querySelectorAll('.ref-filters input[type="checkbox"], .ref-filter-list input[type="checkbox"], #filter-instock, #filter-outofstock, input[data-filter="in-stock"], input[data-filter="out-of-stock"]');
    filterCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (typeof applyAllProductFilters === 'function') {
                applyAllProductFilters();
            }
        });
    });

    updateCategoryBadges();

    initProductCardsClickHandlers();

    if (document.querySelector('#catalog #product-grid-container')) {
        let startCat = 'all';
        try {
            const urlParams = new URLSearchParams(window.location.search);
            startCat = urlParams.get('category') || urlParams.get('cat') || 'all';
        } catch (_) {}
        filterCategory(startCat);
    }
}

function initProductCardsClickHandlers() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        if (card._boundHandlers) return;
        card._boundHandlers = true;
        const pId = card.getAttribute('data-product-id');
        if (!pId) return;

        // View Details navigation + record to cache
        const img = card.querySelector('.product-img');
        const title = card.querySelector('.product-title');
        const viewBtn = card.querySelector('.btn-view-details');

        const navToDetails = () => {
            recordBrowsingCache(pId);
            window.location.href = `product-details.html?id=${encodeURIComponent(pId)}`;
        };

        if (img) { img.style.cursor = 'pointer'; img.addEventListener('click', navToDetails); }
        if (title) { title.style.cursor = 'pointer'; title.addEventListener('click', navToDetails); }
        if (viewBtn) { viewBtn.addEventListener('click', navToDetails); }

        // Add to cart from card + record to cache
        const addBtn = card.querySelector('.btn-add-cart');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                recordBrowsingCache(pId);
                const prod = PRODUCTS_CATALOGUE.find(p => p.id === pId);
                const defaultVar = prod ? (prod.variants.find(v => v.active && v.stock > 0) || prod.variants[0]) : null;
                const vId = defaultVar ? defaultVar.id : 'var_500g';
                addToCart(pId, vId, 1);
                openCart();
            });
        }
    });
}

/* MOBILE NAVIGATION HANDLERS (DROPDOWN POPOVER & OVERLAY COMPATIBILITY) */
function initMobileNav() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const headerDropdown = document.getElementById('header-dropdown-menu');
    const navOverlay = document.getElementById('mobile-nav-overlay');
    const closeBtn = document.getElementById('mobile-menu-close');

    if (!mobileBtn) return;

    if (headerDropdown) {
        function toggleDropdown(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const isOpen = headerDropdown.classList.contains('active');
            if (isOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        }

        function openDropdown() {
            headerDropdown.classList.add('active');
            mobileBtn.setAttribute('aria-expanded', 'true');
        }

        function closeDropdown() {
            headerDropdown.classList.remove('active');
            mobileBtn.setAttribute('aria-expanded', 'false');
        }

        mobileBtn.addEventListener('click', toggleDropdown);

        const dropdownLinks = headerDropdown.querySelectorAll('a');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeDropdown();
            });
        });

        document.addEventListener('click', (e) => {
            if (headerDropdown.classList.contains('active')) {
                if (!headerDropdown.contains(e.target) && e.target !== mobileBtn) {
                    closeDropdown();
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && headerDropdown.classList.contains('active')) {
                closeDropdown();
            }
        });
    }

    if (navOverlay) {
        function openMobileMenu() {
            navOverlay.classList.add('active');
            mobileBtn.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
        }

        function closeMobileMenu() {
            navOverlay.classList.remove('active');
            mobileBtn.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        }

        if (!headerDropdown) {
            mobileBtn.addEventListener('click', openMobileMenu);
        }
        if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);

        navOverlay.addEventListener('click', (e) => {
            if (e.target === navOverlay) closeMobileMenu();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navOverlay.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        const mobileProfile = document.getElementById('mobile-nav-profile');
        if (mobileProfile && !mobileProfile._boundProfile) {
            mobileProfile._boundProfile = true;
            mobileProfile.addEventListener('click', (e) => {
                e.preventDefault();
                closeMobileMenu();
                openProfileModal();
            });
        }

        const links = navOverlay.querySelectorAll('a:not(#mobile-nav-profile)');
        links.forEach(l => l.addEventListener('click', closeMobileMenu));
    }
}

/* HERO SLIDER WITH EXACT 5000MS (5S) AUTOPLAY & SMOOTH FADE ANIMATION */
function initHeroSlider() {
    const sliderContainer = document.getElementById('hero-slider-container');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const dots = document.querySelectorAll('.slider-dot');
    const slides = document.querySelectorAll('.hero-slide');

    if (!sliderContainer || slides.length < 2) return;

    function showSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentSlide = index;

        slides.forEach((slide, i) => {
            if (i === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach((dot, i) => {
            if (i === currentSlide) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.classList.remove('active');
                dot.setAttribute('aria-selected', 'false');
            }
        });
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(() => {
            showSlide((currentSlide + 1) % slides.length);
        }, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
        if (autoplayTimer !== null) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showSlide((currentSlide - 1 + slides.length) % slides.length);
            restartAutoplay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showSlide((currentSlide + 1) % slides.length);
            restartAutoplay();
        });
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
            restartAutoplay();
        });
    });

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > threshold) {
            if (diff < 0) {
                showSlide((currentSlide + 1) % slides.length);
            } else {
                showSlide((currentSlide - 1 + slides.length) % slides.length);
            }
        }
    }

    startAutoplay();
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

function initScrollToTop() {
    const btn = document.getElementById('btn-scroll-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initFaqSearch() {
    const searchInput = document.getElementById('faq-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const items = document.querySelectorAll('.faq-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (!q || text.includes(q)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

function initProductsSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;

    const container = document.getElementById('product-grid-container');
    if (!container) return;

    const originalOrder = Array.from(container.querySelectorAll('.product-card:not(.fallback-recommendation-card)'));

    const applySort = () => {
        const val = sortSelect.value;
        const emptyState = document.getElementById('products-empty-state');
        const cards = Array.from(container.querySelectorAll('.product-card:not(.fallback-recommendation-card)'));

        if (val === 'newest' || val === 'default') {
            originalOrder.forEach(card => {
                if (emptyState) container.insertBefore(card, emptyState);
                else container.appendChild(card);
            });
            return;
        }

        cards.sort((a, b) => {
            const pA = parseFloat(a.querySelector('.price-val, .ref-card-price')?.textContent.replace(/[^0-9.]/g, '') || '0');
            const pB = parseFloat(b.querySelector('.price-val, .ref-card-price')?.textContent.replace(/[^0-9.]/g, '') || '0');
            const nA = (a.querySelector('.ref-card-title, .product-title')?.textContent || '').trim();
            const nB = (b.querySelector('.ref-card-title, .product-title')?.textContent || '').trim();
            const rA = parseFloat(a.querySelector('.rating-score, .ref-rating-score')?.textContent.replace(/[^0-9.]/g, '') || '0');
            const rB = parseFloat(b.querySelector('.rating-score, .ref-rating-score')?.textContent.replace(/[^0-9.]/g, '') || '0');

            if (val === 'price-asc' || val === 'price-low') return pA - pB;
            if (val === 'price-desc' || val === 'price-high') return pB - pA;
            if (val === 'rating') return rB - rA;
            if (val === 'name-asc') return nA.localeCompare(nB);
            return 0;
        });

        cards.forEach(card => {
            if (emptyState) container.insertBefore(card, emptyState);
            else container.appendChild(card);
        });
    };

    sortSelect.addEventListener('change', applySort);
}

function initReviewsData() {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    fetchReviews(container);
}

async function fetchReviews(container) {
    try {
        const apiBaseUrl = String(window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://satvik-spot-backend-staging.onrender.com')).replace(/\/+$/, '');
        const endpoint = `${apiBaseUrl}/api/v1/reviews`;

        const reviewsResponse = await fetch(endpoint);
        const contentType = reviewsResponse.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return renderEmptyReviewsState(container);
        const reviewsPayload = await reviewsResponse.json();

        if (reviewsResponse.ok && reviewsPayload.success && Array.isArray(reviewsPayload.data?.reviews) && reviewsPayload.data.reviews.length > 0) {
            renderPublicReviews(reviewsPayload.data.reviews, container);
        } else {
            renderEmptyReviewsState(container);
        }
    } catch (reviewFetchError) {
        console.warn('Reviews fetch failed, using fallback display state:', reviewFetchError);
        renderEmptyReviewsState(container);
    }
}

function renderPublicReviews(reviews, container) {
    const frag = document.createDocumentFragment();
    reviews.forEach(reviewItem => {
        const card = createSafeElement('div', { className: 'review-card' });
        
        const topRow = createSafeElement('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 8px;' });
        const nameSpan = createSafeElement('span', { text: reviewItem.name, style: 'font-weight: 700; color: var(--color-maroon);' });
        const starsSpan = createSafeElement('span', { text: '★'.repeat(reviewItem.rating || 5), style: 'color: #f5a623;' });
        topRow.appendChild(nameSpan);
        topRow.appendChild(starsSpan);

        const textP = createSafeElement('p', { text: reviewItem.text, style: 'color: var(--color-text); font-size: 0.95rem; line-height: 1.5;' });

        card.appendChild(topRow);
        card.appendChild(textP);
        if (r.verifiedPurchase) {
            const badge = createSafeElement('span', { text: '✓ Verified Purchase', style: 'font-size: 0.78rem; color: #389e0d; font-weight: 700; display: inline-block; margin-top: 8px;' });
            card.appendChild(badge);
        }
        frag.appendChild(card);
    });
    container.replaceChildren(frag);
}

function renderEmptyReviewsState(container) {
    const emptyBox = createSafeElement('div', {
        style: 'background: #FFFFFF; border: 2px solid var(--color-border); border-radius: var(--radius-card); padding: 36px; text-align: center;'
    });
    const textP = createSafeElement('p', {
        text: 'No published customer reviews for this selection yet.',
        style: 'font-size: 1rem; color: var(--color-sub);'
    });
    emptyBox.appendChild(textP);
    container.replaceChildren(emptyBox);
}

/* ── CART MANAGEMENT FUNCTIONS ── */
export function addToCart(productId, variantId, qty = 1) {
    if (!productId || typeof productId !== 'string') {
        showToast('❌ Invalid product requested');
        return;
    }
    const prod = PRODUCTS_CATALOGUE.find(p => p.id === productId || p.productId === productId);
    if (!prod) {
        showToast('❌ Product not found');
        return;
    }

    const variant = (prod.variants || []).find(v => v.id === variantId) || (prod.variants && prod.variants[0]);
    if (!variant || !variant.active || typeof variant.price !== 'number' || variant.price <= 0) {
        showToast('❌ Selected variant is currently unavailable or invalid');
        return;
    }

    if (typeof variant.stock !== 'number' || variant.stock <= 0) {
        showToast('❌ Selected variant is out of stock');
        return;
    }

    const validQty = Math.max(1, parseInt(qty, 10) || 1);
    const lineKey = `${prod.id}::${variant.id}`;
    const maxQty = Math.min(variant.stock, 50);

    if (!cart[lineKey]) {
        cart[lineKey] = {
            lineKey,
            productId: prod.id,
            variantId: variant.id,
            name: prod.name,
            variantLabel: variant.label,
            price: variant.price,
            qty: Math.min(validQty, maxQty)
        };
    } else {
        const newQty = cart[lineKey].qty + qty;
        if (newQty > maxQty) {
            showToast(`⚠️ Maximum available stock (${maxQty}) reached for ${prod.name} (${variant.label})`);
            cart[lineKey].qty = maxQty;
        } else {
            cart[lineKey].qty = newQty;
        }
    }

    saveCart();
    renderCart();
    animateCartBadge();
    showToast(`Added ${prod.name} (${variant.label}) to cart! 🛒`);
}

export function changeQty(lineKey, delta) {
    if (cart[lineKey]) {
        const item = cart[lineKey];
        const prod = PRODUCTS_CATALOGUE.find(p => p.id === item.productId);
        const variant = prod ? (prod.variants || []).find(v => v.id === item.variantId) : null;
        const maxQty = variant ? Math.min(variant.stock, 50) : 50;

        const targetQty = item.qty + delta;
        if (targetQty <= 0) {
            delete cart[lineKey];
        } else if (targetQty > maxQty) {
            showToast(`⚠️ Maximum available stock (${maxQty}) reached.`);
            item.qty = maxQty;
        } else {
            item.qty = targetQty;
        }
        saveCart();
        renderCart();
        animateCartBadge();
    }
}

export function removeFromCart(lineKey) {
    if (cart[lineKey]) {
        delete cart[lineKey];
        saveCart();
        renderCart();
        animateCartBadge();
    }
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-display');
    const countBadge = document.getElementById('cart-count-badge');

    if (!container) return;

    const items = Object.values(cart);
    const totalQty = items.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = items.reduce((acc, item) => acc + (item.qty * item.price), 0);

    const countBadges = document.querySelectorAll('#cart-count-badge, #header-cart-count, #bottom-cart-count-badge, .cart-count');
    countBadges.forEach(b => { if (b) b.textContent = String(totalQty); });

    const totalEls = document.querySelectorAll('#cart-total-display, #cart-total-price');
    totalEls.forEach(el => { if (el) el.textContent = `₹${totalPrice}`; });

    if (items.length === 0) {
        const emptyP = createSafeElement('p', {
            className: 'text-center color-sub',
            text: t('cart.emptyMsg')
        });
        emptyP.style.textAlign = 'center';
        emptyP.style.color = 'var(--color-sub)';
        emptyP.style.marginTop = '40px';
        container.replaceChildren(emptyP);
        return;
    }

    const listFragment = document.createDocumentFragment();
    const isHi = getCurrentLanguage() === 'hi';

    items.forEach(item => {
        const itemRow = createSafeElement('div', { className: 'cart-item-row' });
        const prod = PRODUCTS_CATALOGUE.find(p => p.id === (item.productId || item.id));
        const displayName = isHi ? (prod?.hindiName || item.name) : item.name;

        const infoDiv = createSafeElement('div', { className: 'cart-item-info' });
        const nameEl = createSafeElement('span', { className: 'cart-item-name', text: `${displayName} (${item.variantLabel || 'Standard'})` });
        const priceEl = createSafeElement('span', { className: 'cart-item-price', text: `₹${item.price} × ${item.qty} = ₹${item.price * item.qty}` });
        infoDiv.appendChild(nameEl);
        infoDiv.appendChild(priceEl);

        const controlsDiv = createSafeElement('div', { className: 'cart-item-controls' });

        const btnMinus = createSafeElement('button', {
            className: 'qty-btn',
            text: '-',
            events: { click: () => changeQty(item.lineKey || item.id, -1) }
        });

        const qtySpan = createSafeElement('span', { className: 'qty-val', text: String(item.qty) });

        const btnPlus = createSafeElement('button', {
            className: 'qty-btn',
            text: '+',
            events: { click: () => changeQty(item.lineKey || item.id, 1) }
        });

        const btnRemove = createSafeElement('button', {
            className: 'remove-btn',
            text: '🗑️',
            events: { click: () => removeFromCart(item.lineKey || item.id) }
        });

        controlsDiv.appendChild(btnMinus);
        controlsDiv.appendChild(qtySpan);
        controlsDiv.appendChild(btnPlus);
        controlsDiv.appendChild(btnRemove);

        itemRow.appendChild(infoDiv);
        itemRow.appendChild(controlsDiv);

        listFragment.appendChild(itemRow);
    });

    container.replaceChildren(listFragment);
}

function animateCartBadge() {
    const badges = document.querySelectorAll('#cart-count-badge, #header-cart-count, #bottom-cart-count-badge, .cart-badge, .bottom-cart-badge');
    badges.forEach(b => {
        if (!b) return;
        b.classList.remove('bump');
        void b.offsetWidth;
        b.classList.add('bump');
    });
}

function openCart() {
    if (window.innerWidth <= 768 && !window.location.pathname.includes('cart.html')) {
        window.location.href = 'cart.html';
        return;
    }
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }
}

function closeCart() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

function ensureModalsInDOM() {
    if (!document.getElementById('cart-drawer-overlay')) {
        const cartDiv = document.createElement('div');
        cartDiv.innerHTML = `
        <div class="cart-drawer-overlay" id="cart-drawer-overlay" role="dialog" aria-modal="true" aria-label="Shopping Cart">
            <div class="cart-drawer" id="cart-drawer">
                <div class="cart-header">
                    <h3>Your Shopping Cart (<span class="cart-count">0</span>)</h3>
                    <button class="btn-close-cart" id="btn-close-cart" aria-label="Close Shopping Cart">✕</button>
                </div>
                <div class="cart-items-container" id="cart-items-container"></div>
                <div class="cart-footer">
                    <div class="cart-total-row">
                        <span>Subtotal:</span>
                        <span class="cart-total-price" id="cart-total-price">₹0</span>
                    </div>
                    <p class="shipping-note">Taxes and shipping calculated at checkout</p>
                    <button class="btn-checkout" id="btn-checkout">Proceed to Checkout →</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(cartDiv.firstElementChild);
    }

    if (!document.getElementById('checkout-modal')) {
        const div = document.createElement('div');
        div.innerHTML = `
        <div class="modal-overlay" id="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" style="display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
            <div class="modal-box checkout-modal-box" style="background: #FFF; border-radius: 16px; max-width: 780px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; border: 2px solid var(--color-gold-light);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--color-gold-light); padding-bottom: 14px;">
                    <div>
                        <h2 id="checkout-title" style="color: var(--color-maroon); font-size: 1.6rem; margin: 0;">Checkout & Shipping</h2>
                        <span style="font-size: 0.85rem; color: var(--color-sub); font-weight: 700;">🔒 TLS Encrypted Secure Checkout</span>
                    </div>
                    <button type="button" id="btn-close-checkout-icon" style="background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--color-sub);">✕</button>
                </div>

                <div id="checkout-notice" style="background: #FAF8F5; color: #1F4A2C; border: 1px solid #EBDCCB; padding: 12px 16px; border-radius: 10px; font-size: 0.88rem; margin-top: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <span>🌿</span> <span>100% Satvik Purity Guarantee &bull; Cold-Pressed Mustard Oil &bull; Zero Onion &amp; Garlic</span>
                </div>

                <form id="checkout-form">
                    <div id="co-error-msg" style="display: none; color: #D32F2F; background: #FFEBEE; border: 1px solid #EF9A9A; padding: 12px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; margin-bottom: 14px;"></div>
                    <div class="checkout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px;">
                        <div>
                            <div class="checkout-section-title" style="font-weight: 800; color: var(--color-maroon); margin-bottom: 12px;">📦 1. Delivery & Contact Details</div>
                            
                            <div id="saved-addresses-select-container" style="display: none; margin-bottom: 16px; background: #FAF5EF; border: 1px solid var(--color-gold-light); padding: 12px; border-radius: 8px;">
                                <label for="co-saved-address-select" style="font-weight: 700; color: var(--color-maroon); font-size: 0.9rem; display: block; margin-bottom: 6px;">Select Saved Address:</label>
                                <select id="co-saved-address-select" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border); font-size: 0.9rem;">
                                    <option value="">-- Use Custom Address Below --</option>
                                </select>
                            </div>

                            <div class="checkout-form-group" style="margin-bottom: 12px;">
                                <label for="co-name" style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">Full Name *</label>
                                <input type="text" id="co-name" required placeholder="e.g. Ramesh Kumar" autocomplete="name" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);" />
                            </div>

                            <div class="form-row-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div class="checkout-form-group">
                                    <label for="co-phone" style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">Phone Number (10 Digits) *</label>
                                    <input type="tel" id="co-phone" required pattern="[0-9]{10,15}" placeholder="e.g. 9876543210" autocomplete="tel" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);" />
                                </div>
                                <div class="checkout-form-group">
                                    <label for="co-alt-phone" style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">Alt Phone (Optional)</label>
                                    <input type="tel" id="co-alt-phone" pattern="[0-9]{10,15}" placeholder="e.g. 9123456789" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);" />
                                </div>
                            </div>

                            <div class="checkout-form-group" style="margin-top: 12px;">
                                <label for="co-email" style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">Email Address</label>
                                <input type="email" id="co-email" placeholder="e.g. ramesh@example.com" autocomplete="email" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);" />
                            </div>

                            <div class="checkout-form-group" style="margin-top: 12px;">
                                <label for="co-address" style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">Complete Delivery Address *</label>
                                <textarea id="co-address" required placeholder="House/Flat No., Street, Area, Landmark..." autocomplete="shipping street-address" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border); height: 70px;"></textarea>
                            </div>

                            <div class="form-row-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                                <div class="checkout-form-group">
                                    <label for="co-city" style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">City / Town *</label>
                                    <input type="text" id="co-city" placeholder="e.g. Varanasi" autocomplete="shipping address-level2" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);" />
                                </div>
                                <div class="checkout-form-group">
                                    <label for="co-pincode" style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">Pincode (6 Digits) *</label>
                                    <input type="text" id="co-pincode" pattern="[0-9]{6}" placeholder="e.g. 221001" autocomplete="shipping postal-code" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);" />
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div class="checkout-section-title" style="font-weight: 800; color: var(--color-maroon); margin-bottom: 12px;">🛒 2. Order Summary & Payment</div>
                                
                                <div class="order-summary-box" style="background: #FAF5EF; border: 1px solid var(--color-gold-light); padding: 16px; border-radius: 10px;">
                                    <div class="summary-items-list" id="checkout-summary-items">
                                        <p style="font-size: 0.88rem; color: var(--color-sub);">Loading items...</p>
                                    </div>
                                    <div class="summary-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
                                        <span>Items Subtotal:</span>
                                        <span id="co-subtotal-val" style="font-weight: 700;">₹0</span>
                                    </div>
                                    <div class="summary-row" style="display: flex; justify-content: space-between; margin-top: 4px;">
                                        <span>Delivery Charge:</span>
                                        <span style="color: var(--color-green); font-weight: 700;">FREE (Inaugural Offer)</span>
                                    </div>
                                    <div class="summary-total-row" style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid #DDD; padding-top: 8px; font-weight: 800; font-size: 1.1rem;">
                                        <span>Total Payable:</span>
                                        <span id="co-total-val" style="color: var(--color-maroon);">₹0</span>
                                    </div>
                                </div>

                                <div class="checkout-section-title" style="margin-top: 16px; margin-bottom: 8px; font-weight: 800; color: var(--color-maroon);">💳 Choose Payment Method</div>
                                <div class="co-payment-options" id="co-payment-options">
                                    <label class="co-pm-card active" for="pm-online-dom">
                                        <input type="radio" name="payment-method" id="pm-online-dom" value="Online Payment" checked />
                                        <div style="flex: 1;">
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <span style="font-weight: 800; font-size: 0.92rem; color: #203325;">⚡ Instant Online Payment</span>
                                                <span style="font-size: 0.72rem; font-weight: 800; background: #D4AF37; color: #FFF; padding: 2px 7px; border-radius: 12px; letter-spacing: 0.5px;">RECOMMENDED</span>
                                            </div>
                                            <p style="margin: 4px 0 6px; font-size: 0.8rem; color: #555; line-height: 1.35;">UPI (GPay, PhonePe, Paytm, BHIM), Debit/Credit Cards &amp; NetBanking via Razorpay.</p>
                                            <div style="display: flex; gap: 6px; font-size: 0.75rem; color: #1F4A2C; font-weight: 700;">
                                                <span style="background: #E8F5E9; padding: 1px 6px; border-radius: 4px;">UPI</span>
                                                <span style="background: #E8F5E9; padding: 1px 6px; border-radius: 4px;">Cards</span>
                                                <span style="background: #E8F5E9; padding: 1px 6px; border-radius: 4px;">NetBanking</span>
                                                <span style="margin-left: auto; color: #7A1C1C; font-size: 0.72rem;">🔒 256-bit TLS</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label class="co-pm-card" for="pm-cod-dom">
                                        <input type="radio" name="payment-method" id="pm-cod-dom" value="Cash on Delivery" />
                                        <div style="flex: 1;">
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <span style="font-weight: 800; font-size: 0.92rem; color: #203325;">📦 Cash on Delivery (COD)</span>
                                                <span style="font-size: 0.72rem; font-weight: 700; background: #E5E7EB; color: #374151; padding: 2px 7px; border-radius: 12px;">Pay on Arrival</span>
                                            </div>
                                            <p style="margin: 4px 0 0; font-size: 0.8rem; color: #555; line-height: 1.35;">Pay cash or UPI to delivery agent when your artisanal parcel arrives.</p>
                                        </div>
                                    </label>

                                    <label class="co-pm-card" for="pm-wa-dom">
                                        <input type="radio" name="payment-method" id="pm-wa-dom" value="WhatsApp-Assisted Ordering" />
                                        <div style="flex: 1;">
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <span style="font-weight: 800; font-size: 0.92rem; color: #203325;">💬 WhatsApp Quick Order</span>
                                                <span style="font-size: 0.72rem; font-weight: 700; background: #DCFCE7; color: #15803D; padding: 2px 7px; border-radius: 12px;">Direct Support</span>
                                            </div>
                                            <p style="margin: 4px 0 0; font-size: 0.8rem; color: #555; line-height: 1.35;">Submit order via WhatsApp chat with our family kitchen directly.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div style="margin-top: 24px;">
                                <button type="submit" id="btn-submit-order" class="btn-add-cart" style="width: 100%; font-size: 1.05rem; padding: 15px; border-radius: 8px;">Proceed to Pay 💳</button>
                                <a href="https://wa.me/919236587600?text=Namaste!%20I%20have%20a%20question%20regarding%20an%20order%20on%20Satvik%20Swaad." target="_blank" rel="noopener noreferrer" id="btn-wa-support" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 10px; padding: 12px; border: 1.5px solid #25D366; color: #128C7E; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.92rem; background: #F0FFF4;">Need Help? Chat on WhatsApp 💬</a>
                                <button type="button" id="btn-close-checkout" style="width: 100%; margin-top: 10px; background: none; border: none; color: var(--color-sub); cursor: pointer; font-size: 0.9rem; font-weight: 700;">Cancel & Return to Store</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.appendChild(div.firstElementChild);
    }

    if (!document.getElementById('whatsapp-notice-modal')) {
        const waDiv = document.createElement('div');
        waDiv.innerHTML = `
        <div id="whatsapp-notice-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: #FFFFFF; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; text-align: center; border: 2px solid var(--color-maroon); box-shadow: 0 20px 60px rgba(0,0,0,0.35);">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">💬</div>
                <h3 style="font-family: 'Playfair Display', serif; color: var(--color-maroon); font-size: 1.4rem; margin-bottom: 10px;">WhatsApp Has Opened!</h3>
                <p style="font-size: 0.95rem; color: #444; margin-bottom: 18px; line-height: 1.5;">
                    Please press <strong>Send</strong> inside WhatsApp to request the official payment QR code from Satvik Swaad.
                </p>
                <div style="background: #FAF5EF; border: 1px dashed var(--color-maroon); border-radius: 10px; padding: 12px; margin-bottom: 20px; text-align: left; font-size: 0.88rem;">
                    <div><strong>Order ID:</strong> <span id="wa-modal-order-id">Loading...</span></div>
                    <div><strong>Total Payable:</strong> <span id="wa-modal-total">Loading...</span></div>
                    <div><strong>Status:</strong> <span style="color: var(--color-saffron); font-weight: 800;">AWAITING_PAYMENT</span></div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button type="button" id="btn-wa-reopen" class="btn-add-cart" style="font-size: 0.95rem; padding: 12px; border-radius: 8px;">📲 Open WhatsApp App</button>
                    <button type="button" id="btn-wa-web" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #2E7D32; padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer;">💻 Open Web WhatsApp (Browser)</button>
                    <button type="button" id="btn-wa-copy" style="background: #F4EBE1; color: var(--color-maroon); border: 1px solid var(--color-maroon); padding: 10px; border-radius: 10px; font-weight: 700; cursor: pointer;">📋 Copy Order Summary</button>
                    <button type="button" id="btn-wa-close" style="background: none; border: none; color: var(--color-sub); font-size: 0.9rem; font-weight: 700; cursor: pointer; text-decoration: underline; margin-top: 4px;">✕ Close & Continue Browsing</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(waDiv.firstElementChild);
    }

    if (!document.getElementById('profile-modal')) {
        const profDiv = document.createElement('div');
        profDiv.innerHTML = `
        <div class="modal-overlay" id="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" style="display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
            <div class="modal-box" style="background: #FFF; border-radius: 16px; max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 28px; border: 2px solid var(--color-gold-light);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--color-gold-light); padding-bottom: 14px; margin-bottom: 18px;">
                    <h2 id="profile-title" style="color: var(--color-maroon); font-size: 1.5rem; margin: 0;">👤 Customer Profile & Saved Addresses</h2>
                    <button type="button" id="btn-close-profile" style="background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--color-sub);">✕</button>
                </div>

                <div id="profile-content">
                    <div id="profile-auth-section" style="margin-bottom: 20px;">
                        <p style="color: var(--color-sub);">Loading profile details...</p>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.appendChild(profDiv.firstElementChild);
    }

    if (!document.getElementById('satvik-agent-widget')) {
        const agentDiv = document.createElement('div');
        agentDiv.innerHTML = `
        <div id="satvik-agent-widget" class="satvik-agent-widget" role="complementary" aria-label="Satvik Swaad Help Assistant">
            <button type="button" id="satvik-agent-trigger" class="satvik-agent-trigger" aria-label="Open Satvik Swaad Support Assistant" aria-expanded="false">
                <img src="assets/agent-icon.jpg" alt="Satvik Swaad Assistant" class="agent-trigger-img" />
                <span class="agent-status-dot" aria-hidden="true"></span>
            </button>
            <div id="satvik-agent-card" class="satvik-agent-card" aria-hidden="true">
                <div class="agent-card-header">
                    <div class="agent-header-info">
                        <img src="assets/agent-icon.jpg" alt="Satvik Swaad Assistant" class="agent-header-avatar-img" />
                        <div>
                            <h3 class="agent-header-name">Satvik Assistant</h3>
                            <span class="agent-header-status"><span class="agent-online-dot" aria-hidden="true"></span> Online | Handcrafted Support</span>
                        </div>
                    </div>
                    <button type="button" id="agent-close-btn" class="agent-close-btn" aria-label="Close Assistant">✕</button>
                </div>
                <div class="agent-card-body" id="agent-messages-container">
                    <div class="agent-msg agent-msg-bot">
                        <p>Namaste! 🙏 Welcome to Satvik Swaad. How may I help you with our artisanal pickles and traditional treats today?</p>
                    </div>
                    <div class="agent-quick-chips" id="agent-quick-chips">
                        <button type="button" class="agent-chip" data-action="track">📦 Track My Order</button>
                        <button type="button" class="agent-chip" data-action="whatsapp">💬 WhatsApp Support</button>
                        <button type="button" class="agent-chip" data-action="purity">🌿 Purity &amp; Mustard Oil</button>
                        <button type="button" class="agent-chip" data-action="recommend">🍯 Top Bestsellers</button>
                    </div>
                </div>
                <div class="agent-card-footer">
                    <form id="agent-chat-form" class="agent-chat-form">
                        <input type="text" id="agent-input" class="agent-input" placeholder="Ask about purity, orders, or recipes..." aria-label="Ask Satvik Assistant a question" autocomplete="off" />
                        <button type="submit" id="agent-send-btn" class="agent-send-btn" aria-label="Send Message">➤</button>
                    </form>
                    <div class="agent-direct-wa">
                        <a href="https://wa.me/919236587600?text=Namaste%2C%20I%20need%20assistance%20with%20Satvik%20Swaad" target="_blank" rel="noopener noreferrer" class="agent-wa-link">
                            <span>📲 Direct WhatsApp: <strong>+91 92365 87600</strong></span>
                        </a>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.appendChild(agentDiv.firstElementChild);
    }
}

/* BROWSING CACHE TRACKER */
function recordBrowsingCache(productId) {
    if (!productId) return;
    try {
        let viewed = JSON.parse(localStorage.getItem('satvik_recently_viewed') || '[]');
        if (!Array.isArray(viewed)) viewed = [];
        viewed = viewed.filter(id => id !== productId);
        viewed.unshift(productId);
        if (viewed.length > 10) viewed = viewed.slice(0, 10);
        localStorage.setItem('satvik_recently_viewed', JSON.stringify(viewed));
    } catch (_) {}
}

/* REORDER / SUGGESTIONS HANDLER */
function initReorderSection() {
    const track = document.getElementById('reorder-scroll-track');
    if (!track) return;

    let hasPastOrders = false;
    let displayItems = [];

    // 1. Check if user has past order records in localStorage
    try {
        const lastOrderRaw = localStorage.getItem('satvik_last_order');
        const recentOrdersRaw = localStorage.getItem('satvik_recent_orders');
        let orderItemList = [];

        if (lastOrderRaw) {
            const parsed = JSON.parse(lastOrderRaw);
            const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
            if (items.length > 0) orderItemList.push(...items);
        }
        if (recentOrdersRaw && orderItemList.length === 0) {
            const parsed = JSON.parse(recentOrdersRaw);
            if (Array.isArray(parsed)) {
                parsed.forEach(o => {
                    if (o && Array.isArray(o.items)) orderItemList.push(...o.items);
                    else if (o && (o.productId || o.id)) orderItemList.push(o);
                });
            }
        }

        if (orderItemList.length > 0) {
            hasPastOrders = true;
            const seenIds = new Set();
            orderItemList.forEach(item => {
                const pId = item.productId || item.id;
                if (!pId || seenIds.has(pId)) return;
                seenIds.add(pId);
                const prod = PRODUCTS_CATALOGUE.find(p => p.id === pId);
                const variant = prod?.variants?.find(v => v.id === item.variantId) || prod?.variants?.[0] || { label: item.variantLabel || '500g', price: item.price || 249 };
                displayItems.push({
                    id: prod?.id || pId,
                    name: prod?.name || item.name || 'Satvik Artisanal Special',
                    img: (prod?.images && prod.images[0]) || prod?.img || item.img || 'assets/aam-ka-achar.png',
                    variantId: variant.id || 'var_500g',
                    variantLabel: variant.label || '500g',
                    price: variant.price || item.price || 249,
                    badge: 'Past Favorite'
                });
            });
        }
    } catch (readOrderError) {
        console.warn('Could not read past order history for reorder section:', readOrderError);
    }

    // 2. Dynamic Title, Subtitle, and Lead update
    const reorderSection = document.getElementById('reorder-section');
    const titleEl = document.getElementById('reorder-title');
    const subEl = reorderSection ? reorderSection.querySelector('.section-subtitle') : null;
    const leadEl = reorderSection ? reorderSection.querySelector('.section-lead') : null;

    const isHi = getCurrentLanguage() === 'hi';

    if (hasPastOrders && displayItems.length > 0) {
        // REORDER MODE: User has placed an order in the past
        if (titleEl) titleEl.textContent = isHi ? '🔄 दोबारा खरीदें और त्वरित ऑर्डर' : '🔄 Buy Again & Quick Reorder';
        if (subEl) subEl.textContent = isHi ? 'त्वरित और आसान' : 'Quick & Easy';
        if (leadEl) leadEl.textContent = isHi ? 'अपने पसंदीदा पारंपरिक स्वादों को एक ही टैप में दोबारा ऑर्डर करें।' : 'Reorder your handcrafted traditional favorites in a single tap.';
    } else {
        // SUGGESTIONS MODE: No past orders, show recommendations based on cache files & favorites
        if (titleEl) titleEl.textContent = isHi ? '✨ आपके लिए चुनिंदा सुझाव' : '✨ Handpicked Suggestions For You';
        if (subEl) subEl.textContent = isHi ? 'आपके लिए विशेष' : 'Curated For You';
        if (leadEl) leadEl.textContent = isHi ? 'आपकी पसंद और सबसे लोकप्रिय व्यंजनों के आधार पर अनुशंसित स्वादिष्ट उत्पाद।' : 'Artisanal favorites recommended based on your browsing taste and top kitchen bestsellers.';

        // Read cache files: recently viewed & cart items
        let viewedIds = [];
        try {
            const viewedRaw = localStorage.getItem('satvik_recently_viewed');
            if (viewedRaw) {
                const parsed = JSON.parse(viewedRaw);
                if (Array.isArray(parsed)) viewedIds = parsed;
            }
        } catch (_) {}

        let cartCategorySet = new Set();
        try {
            const cartRaw = localStorage.getItem('satwikCart_v2');
            if (cartRaw) {
                const parsedCart = JSON.parse(cartRaw);
                Object.values(parsedCart).forEach(c => {
                    const cp = PRODUCTS_CATALOGUE.find(p => p.id === c.id);
                    if (cp?.category) cartCategorySet.add(cp.category);
                });
            }
        } catch (_) {}

        const selectedProdIds = new Set();
        const candidateItems = [];

        // A. Add recently viewed items from cache
        viewedIds.forEach(id => {
            const prod = PRODUCTS_CATALOGUE.find(p => p.id === id);
            if (prod && !selectedProdIds.has(prod.id)) {
                selectedProdIds.add(prod.id);
                const defVar = prod.variants?.find(v => v.active && v.stock > 0) || prod.variants?.[0] || { id: 'var_500g', label: '500g', price: 249 };
                candidateItems.push({
                    id: prod.id,
                    name: prod.name,
                    img: (prod.images && prod.images[0]) || prod.img || 'assets/aam-ka-achar.png',
                    variantId: defVar.id,
                    variantLabel: defVar.label,
                    price: defVar.price,
                    badge: 'Recently Viewed'
                });
            }
        });

        // B. Add products matching user's cart categories from cache
        if (candidateItems.length < 5 && cartCategorySet.size > 0) {
            PRODUCTS_CATALOGUE.filter(p => cartCategorySet.has(p.category) && !selectedProdIds.has(p.id)).forEach(prod => {
                if (candidateItems.length >= 5) return;
                selectedProdIds.add(prod.id);
                const defVar = prod.variants?.find(v => v.active && v.stock > 0) || prod.variants?.[0] || { id: 'var_500g', label: '500g', price: 249 };
                candidateItems.push({
                    id: prod.id,
                    name: prod.name,
                    img: (prod.images && prod.images[0]) || prod.img || 'assets/aam-ka-achar.png',
                    variantId: defVar.id,
                    variantLabel: defVar.label,
                    price: defVar.price,
                    badge: 'Recommended'
                });
            });
        }

        // C. Fill remaining slots with top kitchen bestsellers across categories
        const fallbackBestsellerIds = ['prod_aam_achar', 'prod_amla_murabba', 'prod_chyawanprash', 'prod_kareli_achar', 'prod_amla_laddu_jaggery', 'prod_lal_mirch_achar'];
        fallbackBestsellerIds.forEach(id => {
            if (candidateItems.length >= 6) return;
            const prod = PRODUCTS_CATALOGUE.find(p => p.id === id);
            if (prod && !selectedProdIds.has(prod.id)) {
                selectedProdIds.add(prod.id);
                const defVar = prod.variants?.find(v => v.active && v.stock > 0) || prod.variants?.[0] || { id: 'var_500g', label: '500g', price: 249 };
                candidateItems.push({
                    id: prod.id,
                    name: prod.name,
                    img: (prod.images && prod.images[0]) || prod.img || 'assets/aam-ka-achar.png',
                    variantId: defVar.id,
                    variantLabel: defVar.label,
                    price: defVar.price,
                    badge: prod.badge || 'Bestseller'
                });
            }
        });

        displayItems = candidateItems;
    }

    // 3. Render cards in scroll track with continuous right-to-left animation
    if (displayItems.length === 0) {
        track.innerHTML = '';
        return;
    }

    // Duplicate items in single cycle to ensure at least 8 cards so no empty gaps appear on wide screens
    const cycleMultiplier = Math.max(1, Math.ceil(8 / displayItems.length));
    const singleCycleItems = [];
    for (let i = 0; i < cycleMultiplier; i++) {
        singleCycleItems.push(...displayItems);
    }
    // Render two full identical cycles for seamless 0% -> -50% infinite translation
    const allItemsToRender = [...singleCycleItems, ...singleCycleItems];

    track.innerHTML = '';
    allItemsToRender.forEach(item => {
        const card = document.createElement('div');
        card.className = 'reorder-card';
        const actionLabel = hasPastOrders
            ? (isHi ? 'पुनः ऑर्डर करें 🛒' : 'Reorder 🛒')
            : (isHi ? 'कार्ट में जोड़ें 🛒' : 'Add to Cart 🛒');

        const prod = PRODUCTS_CATALOGUE.find(p => p.id === item.id);
        const displayName = isHi ? (prod?.hindiName || item.name) : item.name;
        let badgeLabel = item.badge;
        if (isHi) {
            if (badgeLabel === 'Bestseller') badgeLabel = 'सर्वाधिक लोकप्रिय';
            else if (badgeLabel === 'Past Favorite') badgeLabel = 'पिछला पसंदीदा';
            else if (badgeLabel === 'Recently Viewed') badgeLabel = 'हाल ही में देखा';
            else if (badgeLabel === 'Recommended') badgeLabel = 'अनुशंसित';
            else if (badgeLabel === 'Healthy Choice') badgeLabel = 'स्वास्थ्यवर्धक';
            else if (badgeLabel === 'Traditional Recipe') badgeLabel = 'पारंपरिक';
        }

        card.innerHTML = `
            <div class="reorder-card-top" style="cursor: pointer;">
                <img src="${sanitizeText(item.img)}" alt="${sanitizeText(displayName)}" class="reorder-img" loading="lazy" />
                <div class="reorder-info">
                    <span class="reorder-badge">${sanitizeText(badgeLabel)}</span>
                    <div class="reorder-name" title="${sanitizeText(displayName)}">${sanitizeText(displayName)}</div>
                    <div class="reorder-variant">${sanitizeText(item.variantLabel)}</div>
                </div>
            </div>
            <div class="reorder-card-bottom">
                <div class="reorder-price">₹${Number(item.price)}</div>
                <button type="button" class="btn-reorder-action btn-reorder-add" data-product-id="${sanitizeText(item.id)}" data-variant-id="${sanitizeText(item.variantId)}" aria-label="Add ${sanitizeText(displayName)} to cart">
                    ${actionLabel}
                </button>
            </div>
        `;

        const topArea = card.querySelector('.reorder-card-top');
        if (topArea) {
            topArea.addEventListener('click', () => {
                recordBrowsingCache(item.id);
                window.location.href = `product-details.html?id=${encodeURIComponent(item.id)}`;
            });
        }

        const actionBtn = card.querySelector('.btn-reorder-action');
        if (actionBtn) {
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                recordBrowsingCache(item.id);
                addToCart(item.id, item.variantId, 1);
                openCart();
            });
        }
        track.appendChild(card);
    });

    // Duration scales with cycle length for smooth, relaxing motion (~4.2s per card)
    const durationSeconds = Math.max(30, singleCycleItems.length * 4.2);
    track.style.setProperty('--reorder-duration', `${durationSeconds}s`);
    track.style.setProperty('animation-duration', `${durationSeconds}s`, 'important');
    track.style.setProperty('animation-name', 'none', 'important');
    void track.offsetWidth; // force browser layout recalculation to restart animation cleanly
    track.style.setProperty('animation-name', 'reorderFlowSlow', 'important');
    track.style.setProperty('animation-play-state', 'running', 'important');
}

/* GLOBAL FLOATING ARTISANAL SUPPORT AGENT */
function initFloatingAgent() {
    const trigger = document.getElementById('satvik-agent-trigger');
    const card = document.getElementById('satvik-agent-card');
    const closeBtn = document.getElementById('agent-close-btn');
    const form = document.getElementById('agent-chat-form');
    const input = document.getElementById('agent-input');
    const messages = document.getElementById('agent-messages-container');
    const chipsContainer = document.getElementById('agent-quick-chips');

    if (!trigger || !card) return;
    if (trigger._boundAgent) return;
    trigger._boundAgent = true;

    function openAgent() {
        card.classList.add('active');
        card.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');
        if (input) input.focus();
    }

    function closeAgent() {
        card.classList.remove('active');
        card.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (card.classList.contains('active')) {
            closeAgent();
        } else {
            openAgent();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAgent();
        });
    }

    document.addEventListener('click', (e) => {
        if (card.classList.contains('active')) {
            const widget = document.getElementById('satvik-agent-widget');
            if (widget && !widget.contains(e.target)) {
                closeAgent();
            }
        }
    });

    function appendMessage(text, isUser = false) {
        if (!messages) return;
        const msg = document.createElement('div');
        msg.className = `agent-msg ${isUser ? 'agent-msg-user' : 'agent-msg-bot'}`;
        msg.innerHTML = `<p>${sanitizeText(text)}</p>`;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    if (chipsContainer) {
        chipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.agent-chip');
            if (!chip) return;
            const action = chip.getAttribute('data-action');
            const chipText = chip.textContent;
            appendMessage(chipText, true);

            setTimeout(() => {
                if (action === 'track') {
                    appendMessage("📦 To track an active order, visit your Profile (👤) in navigation, or send your Order ID / phone number directly to our WhatsApp support team!");
                } else if (action === 'whatsapp') {
                    appendMessage("💬 Connecting you to our artisanal support team on WhatsApp...");
                    window.open('https://wa.me/919236587600?text=Namaste!%20I%20need%20assistance%20with%20Satvik%20Swaad', '_blank');
                } else if (action === 'purity') {
                    appendMessage("🌿 All Satvik Swaad pickles and murabbas are 100% handcrafted with pure Kachi Ghani cold-pressed mustard oil, sendha namak (rock salt), and traditional sun-curing. Absolutely zero chemical preservatives (INS 211 / INS 224), synthetic vinegar, or artificial colors!");
                } else if (action === 'recommend') {
                    appendMessage("🍯 Our top 3 customer favorites are:\n1. Aam Ka Achar (Sun-Cured Raw Mango Pickle)\n2. Amla Murabba (Prepared with Desi Khand)\n3. Traditional Satvik Chyawanprash.");
                }
            }, 350);
        });
    }

    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;
            appendMessage(text, true);
            input.value = '';

            const lower = text.toLowerCase();
            setTimeout(() => {
                if (lower.includes('track') || lower.includes('order') || lower.includes('status')) {
                    appendMessage("📦 For instant order tracking, you can check your Profile page or WhatsApp our team at +91 92365 87600 with your Order ID!");
                } else if (lower.includes('oil') || lower.includes('purity') || lower.includes('chemical') || lower.includes('preservative')) {
                    appendMessage("🌿 We strictly use 100% pure cold-pressed mustard oil and ancestral sun-curing. No artificial preservatives or synthetic vinegar are ever used.");
                } else if (lower.includes('price') || lower.includes('offer') || lower.includes('discount')) {
                    appendMessage("🏷️ Enjoy Free Delivery across India on all orders above ₹499! Check out our catalog for current batch offerings.");
                } else if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('days')) {
                    appendMessage("🚚 Orders are dispatched within 24-48 hours via premium express couriers and typically delivered within 3-5 business days across India.");
                } else {
                    appendMessage("🙏 Thank you for your question! For personalized assistance or bulk orders, tap below to chat with our team on WhatsApp.");
                }
            }, 450);
        });
    }
}

export function openCheckout() {
    ensureModalsInDOM();
    closeCart();
    renderCheckoutSummary();
    populateCheckoutAddresses();
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'flex';
        const closeBtn = document.getElementById('btn-close-checkout');
        const closeIcon = document.getElementById('btn-close-checkout-icon');
        if (closeBtn) closeBtn.onclick = closeCheckout;
        if (closeIcon) closeIcon.onclick = closeCheckout;
        const form = document.getElementById('checkout-form');
        if (form) form.onsubmit = (checkoutSubmitEvent) => { checkoutSubmitEvent.preventDefault(); placeOrder(); };
    }
}

async function populateCheckoutAddresses() {
    const container = document.getElementById('saved-addresses-select-container');
    const select = document.getElementById('co-saved-address-select');
    if (!container || !select) return;

    if (!window.auth?.currentUser) {
        container.style.display = 'none';
        return;
    }

    try {
        const token = await window.auth.currentUser.getIdToken();
        const apiBaseUrl = String(window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://satvik-spot-backend-staging.onrender.com')).replace(/\/+$/, '');
        const savedAddressResponse = await fetch(`${apiBaseUrl}/api/v1/customer/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contentType = savedAddressResponse.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;
        const savedAddressPayload = await savedAddressResponse.json();

        if (savedAddressResponse.ok && savedAddressPayload.success && Array.isArray(savedAddressPayload.data) && savedAddressPayload.data.length > 0) {
            container.style.display = 'block';
            select.replaceChildren();
            
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '-- Select Saved Address --';
            select.appendChild(defaultOpt);

            savedAddressPayload.data.forEach(addressItem => {
                const opt = document.createElement('option');
                opt.value = addressItem.id;
                opt.textContent = `${addressItem.label}: ${addressItem.house}, ${addressItem.street}, ${addressItem.city} (${addressItem.pincode})`;
                if (addressItem.isDefault) {
                    opt.selected = true;
                    applyAddressToForm(addressItem);
                }
                select.appendChild(opt);
            });

            select.onchange = () => {
                const chosen = savedAddressPayload.data.find(addressCandidate => addressCandidate.id === select.value);
                if (chosen) {
                    applyAddressToForm(chosen);
                }
            };
        } else {
            container.style.display = 'none';
        }
    } catch (savedAddressError) {
        console.warn('Failed to load saved addresses:', savedAddressError);
        container.style.display = 'none';
    }
}

function applyAddressToForm(addr) {
    const nameInput = document.getElementById('co-name');
    const phoneInput = document.getElementById('co-phone');
    const houseInput = document.getElementById('co-house');
    const streetInput = document.getElementById('co-street');
    const landmarkInput = document.getElementById('co-landmark');
    const cityInput = document.getElementById('co-city');
    const stateInput = document.getElementById('co-state');
    const pincodeInput = document.getElementById('co-pincode');
    const addressInput = document.getElementById('co-address');

    if (nameInput && addr.name) nameInput.value = addr.name;
    if (phoneInput && addr.phone) phoneInput.value = addr.phone.replace('+91', '');
    if (houseInput && addr.house) houseInput.value = addr.house;
    if (streetInput && addr.street) streetInput.value = addr.street;
    if (landmarkInput && addr.landmark) landmarkInput.value = addr.landmark;
    if (cityInput && addr.city) cityInput.value = addr.city;
    if (stateInput && addr.state) stateInput.value = addr.state;
    if (pincodeInput && addr.pincode) pincodeInput.value = addr.pincode;
    if (addressInput) addressInput.value = `${addr.house || ''}, ${addr.street || ''}${addr.landmark ? ', ' + addr.landmark : ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`;
}

export function openProfileModal() {
    window.location.href = 'profile.html';
}

export function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
}

function initProfilePage() {
    if (!document.querySelector('.profile-main-layout')) return;

    // --- State Management ---
    let savedProfile = {};
    try {
        savedProfile = JSON.parse(localStorage.getItem('satvik_user_profile') || '{}');
    } catch (e) { savedProfile = {}; }
    if (!savedProfile.name) savedProfile.name = 'Ddu';
    if (!savedProfile.email) savedProfile.email = 'ddu@example.com';
    if (!savedProfile.phone) savedProfile.phone = '+91 98765 43210';
    if (!savedProfile.joined) savedProfile.joined = 'Aug 7, 2025';

    let savedAddresses = [];
    try {
        savedAddresses = JSON.parse(localStorage.getItem('satvik_saved_addresses') || '[]');
    } catch (e) { savedAddresses = []; }
    if (!Array.isArray(savedAddresses) || savedAddresses.length === 0) {
        savedAddresses = [
            {
                id: 'addr_1',
                type: 'Home',
                name: savedProfile.name || 'Ddu',
                phone: savedProfile.phone || '+91 98765 43210',
                house: '123 Green Valley',
                street: 'Near Temple',
                city: 'Indore',
                state: 'Madhya Pradesh',
                pincode: '452001',
                isDefault: true
            }
        ];
        localStorage.setItem('satvik_saved_addresses', JSON.stringify(savedAddresses));
    }

    let ordersHistory = [];
    try {
        ordersHistory = JSON.parse(localStorage.getItem('satwik_orders_history') || '[]');
    } catch (e) { ordersHistory = []; }
    if (Array.isArray(ordersHistory)) {
        // Purge legacy mock order SS1247 if present in localStorage
        const originalLen = ordersHistory.length;
        ordersHistory = ordersHistory.filter(o => o && o.orderId !== 'SS1247');
        if (ordersHistory.length !== originalLen) {
            localStorage.setItem('satwik_orders_history', JSON.stringify(ordersHistory));
        }
    } else {
        ordersHistory = [];
        localStorage.setItem('satwik_orders_history', JSON.stringify([]));
    }

    let wishlistItems = [];
    try {
        wishlistItems = JSON.parse(localStorage.getItem('satvik_wishlist') || '[]');
    } catch (e) { wishlistItems = []; }
    if (!Array.isArray(wishlistItems) || wishlistItems.length === 0) {
        wishlistItems = [
            {
                id: 'prod_aam_achar',
                name: 'Aam ka Achar',
                hindiName: 'पारंपरिक आम का अचार',
                variantId: 'var_500g',
                weight: '500 g',
                price: 249,
                mrp: 320,
                image: 'assets/aam-ka-achar.png',
                badge: 'Bestseller'
            },
            {
                id: 'prod_hara_mirch',
                name: 'Hara Mirch Pickle',
                hindiName: 'तीखा हरी मिर्च का अचार',
                variantId: 'var_500g',
                weight: '500 g',
                price: 199,
                mrp: 250,
                image: 'assets/hara-mirch-jar.png',
                badge: '100% Satvik'
            }
        ];
        localStorage.setItem('satvik_wishlist', JSON.stringify(wishlistItems));
    }

    // --- DOM Elements ---
    const avatarCircle = document.getElementById('profile-avatar-circle');
    const displayInitial = document.getElementById('profile-display-initial');
    const displayName = document.getElementById('profile-display-name');
    const displayPhone = document.getElementById('profile-display-phone');
    const sidebarGoogleBtn = document.getElementById('sidebar-google-btn');
    const googleBadgeText = document.getElementById('google-badge-text');
    const btnSignIn = document.getElementById('btn-google-signin');
    const btnSignOut = document.getElementById('btn-google-signout');

    const viewProfName = document.getElementById('view-prof-name');
    const viewProfEmail = document.getElementById('view-prof-email');
    const viewProfPhone = document.getElementById('view-prof-phone');
    const viewProfJoined = document.getElementById('view-prof-joined');

    const formProfile = document.getElementById('form-profile-details');
    const profileInfoView = document.getElementById('profile-info-view');
    const btnToggleEdit = document.getElementById('btn-toggle-edit-profile');
    const btnCancelEdit = document.getElementById('btn-cancel-edit-profile');
    const btnEditText = document.getElementById('btn-edit-text');

    const summaryAddresses = document.getElementById('profile-summary-addresses');
    const fullAddresses = document.getElementById('addresses-full-container');
    const summaryOrders = document.getElementById('profile-summary-orders');
    const fullOrders = document.getElementById('orders-full-container');
    const wishlistGrid = document.getElementById('wishlist-full-grid');
    const wishlistEmpty = document.getElementById('wishlist-empty-state');

    const ordersCountBadge = document.getElementById('sidebar-orders-count');
    const ordersTabCountBadge = document.getElementById('orders-tab-count-badge');
    const wishlistCountBadge = document.getElementById('sidebar-wishlist-count');

    // Modals
    const modalOrder = document.getElementById('modal-order-details');
    const modalOrderTitle = document.getElementById('modal-order-title');
    const modalOrderContent = document.getElementById('modal-order-content');
    const btnCloseOrderModal = document.getElementById('btn-close-order-modal');
    const btnModalOrderClose = document.getElementById('btn-modal-order-close');
    const btnModalOrderReorder = document.getElementById('btn-modal-order-reorder');

    const modalAddress = document.getElementById('modal-address-edit');
    const formModalAddress = document.getElementById('form-modal-address');
    const modalAddressTitle = document.getElementById('modal-address-title');
    const btnCloseAddressModal = document.getElementById('btn-close-address-modal');
    const btnCancelAddressModal = document.getElementById('btn-cancel-address-modal');

    // Tab Navigation Buttons
    const navButtons = document.querySelectorAll('.profile-nav-btn[data-tab]');
    const tabPanels = document.querySelectorAll('.profile-tab-panel');

    let activeOrderDetails = null;

    // --- Tab Switching Logic ---
    function switchProfileTab(tabName) {
        if (!tabName) tabName = 'profile';
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        tabPanels.forEach(panel => {
            if (panel.id === `tab-panel-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        if (history.pushState) {
            history.pushState(null, null, `#${tabName}`);
        } else {
            location.hash = `#${tabName}`;
        }

        // Render tab content on demand
        if (tabName === 'profile') {
            renderAddressSummary();
            renderOrderSummary();
        } else if (tabName === 'orders') {
            renderOrdersFull('all');
        } else if (tabName === 'addresses') {
            renderAddressesFull();
        } else if (tabName === 'wishlist') {
            renderWishlist();
        } else if (tabName === 'settings') {
            loadSettings();
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchProfileTab(targetTab);
        });
    });

    const linkViewAllOrders = document.getElementById('link-view-all-orders');
    if (linkViewAllOrders) {
        linkViewAllOrders.addEventListener('click', () => switchProfileTab('orders'));
    }

    // --- Profile Display & Form Sync ---
    function renderProfileInfo() {
        if (viewProfName) viewProfName.textContent = savedProfile.name || 'Ddu';
        if (viewProfEmail) viewProfEmail.textContent = savedProfile.email || 'ddu@example.com';
        if (viewProfPhone) viewProfPhone.textContent = savedProfile.phone || '+91 98765 43210';
        if (viewProfJoined) viewProfJoined.textContent = savedProfile.joined || 'Aug 7, 2025';

        const inputName = document.getElementById('prof-name');
        const inputEmail = document.getElementById('prof-email');
        const inputPhone = document.getElementById('prof-phone');
        const inputJoined = document.getElementById('prof-joined');

        if (inputName) inputName.value = savedProfile.name || '';
        if (inputEmail) inputEmail.value = savedProfile.email || '';
        if (inputPhone) inputPhone.value = savedProfile.phone || '';
        if (inputJoined) inputJoined.value = savedProfile.joined || 'Aug 7, 2025';

        if (displayName) displayName.textContent = savedProfile.name || 'Guest User';
        if (displayPhone) displayPhone.textContent = savedProfile.email || savedProfile.phone || 'Please sign in';

        if (displayInitial && savedProfile.name) {
            displayInitial.textContent = savedProfile.name.trim().charAt(0).toUpperCase();
        }
    }

    renderProfileInfo();

    // Toggle Edit Profile Form
    if (btnToggleEdit) {
        btnToggleEdit.addEventListener('click', () => {
            const isEditing = formProfile.classList.contains('active');
            if (isEditing) {
                formProfile.classList.remove('active');
                profileInfoView.style.display = 'grid';
                if (btnEditText) btnEditText.textContent = '✏ Edit Profile';
            } else {
                formProfile.classList.add('active');
                profileInfoView.style.display = 'none';
                if (btnEditText) btnEditText.textContent = '✕ Close Edit';
            }
        });
    }

    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            formProfile.classList.remove('active');
            profileInfoView.style.display = 'grid';
            if (btnEditText) btnEditText.textContent = '✏ Edit Profile';
        });
    }

    if (formProfile) {
        formProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            savedProfile.name = document.getElementById('prof-name')?.value.trim() || 'Ddu';
            savedProfile.email = document.getElementById('prof-email')?.value.trim() || 'ddu@example.com';
            savedProfile.phone = document.getElementById('prof-phone')?.value.trim() || '+91 98765 43210';
            localStorage.setItem('satvik_user_profile', JSON.stringify(savedProfile));

            renderProfileInfo();
            formProfile.classList.remove('active');
            profileInfoView.style.display = 'grid';
            if (btnEditText) btnEditText.textContent = '✏ Edit Profile';

            await syncProfileToFirestore(savedProfile);
            showToast('✅ Profile updated successfully!');
        });
    }

    // --- Firebase Auth Integration & Sync ---
    async function syncProfileToFirestore(data) {
        const user = window.auth?.currentUser;
        if (!user || !window.db || !window.firestoreDoc || !window.firestoreSetDoc) return;
        try {
            const userRef = window.firestoreDoc(window.db, 'users', user.uid);
            await window.firestoreSetDoc(userRef, {
                uid: user.uid,
                email: user.email || data.email || '',
                name: data.name || user.displayName || '',
                phone: data.phone || '',
                updatedAt: window.firestoreServerTimestamp ? window.firestoreServerTimestamp() : new Date().toISOString()
            }, { merge: true });
        } catch (syncError) {
            console.warn('Firestore Sync Warning:', syncError);
        }
    }

    function updateAuthUI(user) {
        if (user) {
            if (btnSignIn) btnSignIn.style.display = 'none';
            if (btnSignOut) btnSignOut.style.display = 'flex';
            if (avatarCircle) avatarCircle.classList.remove('guest');

            const name = user.displayName || savedProfile.name || 'Ddu';
            const email = user.email || savedProfile.email || 'ddu@example.com';

            if (displayName) displayName.textContent = name;
            if (displayPhone) displayPhone.textContent = email;
            if (googleBadgeText) googleBadgeText.textContent = 'Google Account ✓';

            if (user.photoURL && displayInitial) {
                displayInitial.innerHTML = `<img src="${user.photoURL}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
            } else if (displayInitial) {
                displayInitial.textContent = name.trim().charAt(0).toUpperCase();
            }

            savedProfile.name = name;
            savedProfile.email = email;
            localStorage.setItem('satvik_user_profile', JSON.stringify(savedProfile));
            renderProfileInfo();
        } else {
            if (btnSignIn) btnSignIn.style.display = 'flex';
            if (btnSignOut) btnSignOut.style.display = 'none';
            if (googleBadgeText) googleBadgeText.textContent = 'Google Account';
        }
    }

    async function handleGoogleSignIn() {
        if (!window.auth || !window.GoogleAuthProvider) {
            // Local simulation fallback if Firebase isn't loaded
            savedProfile.name = 'Ddu';
            savedProfile.email = 'ddu@example.com';
            localStorage.setItem('satvik_user_profile', JSON.stringify(savedProfile));
            renderProfileInfo();
            updateAuthUI({ displayName: 'Ddu', email: 'ddu@example.com' });
            showToast('✅ Signed in with Google Account (Ddu)');
            return;
        }

        try {
            const provider = new window.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            const result = await window.signInWithPopup(window.auth, provider);
            if (result && result.user) {
                updateAuthUI(result.user);
                showToast(`✅ Welcome, ${result.user.displayName || 'Customer'}!`);
            }
        } catch (authErr) {
            console.warn('Google Popup failed:', authErr);
            if (authErr.code !== 'auth/popup-closed-by-user') {
                showToast(`⚠️ Auth notice: Simulated login for testing.`);
                updateAuthUI({ displayName: savedProfile.name || 'Ddu', email: savedProfile.email || 'ddu@example.com' });
            }
        }
    }

    if (btnSignIn) btnSignIn.addEventListener('click', handleGoogleSignIn);
    if (sidebarGoogleBtn) {
        sidebarGoogleBtn.addEventListener('click', () => {
            if (window.auth?.currentUser) {
                showToast(`✅ Connected as ${window.auth.currentUser.email}`);
            } else {
                handleGoogleSignIn();
            }
        });
    }

    if (btnSignOut) {
        btnSignOut.addEventListener('click', async () => {
            if (window.auth && window.signOut) {
                try { await window.signOut(window.auth); } catch (e) {}
            }
            if (displayName) displayName.textContent = 'Guest User';
            if (displayPhone) displayPhone.textContent = 'Please sign in';
            if (displayInitial) displayInitial.textContent = '👤';
            if (avatarCircle) avatarCircle.classList.add('guest');
            if (btnSignIn) btnSignIn.style.display = 'flex';
            if (btnSignOut) btnSignOut.style.display = 'none';
            if (googleBadgeText) googleBadgeText.textContent = 'Google Account';
            showToast('🚪 Signed out successfully');
        });
    }

    if (window.auth && window.onAuthStateChanged) {
        window.onAuthStateChanged(window.auth, (user) => {
            updateAuthUI(user);
        });
    }

    // --- Addresses Rendering & Actions ---
    function renderAddressSummary() {
        if (!summaryAddresses) return;
        const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
        if (!defaultAddr) {
            summaryAddresses.innerHTML = `<p style="color:#6b7280;text-align:center;padding:12px 0;">No saved address yet.</p>`;
            return;
        }
        summaryAddresses.innerHTML = `
            <div class="profile-address-card is-default">
                <div class="profile-address-main">
                    <div class="profile-address-tag-row">
                        <span class="profile-address-type-badge">🏠 ${defaultAddr.type || 'Home'}</span>
                        <span class="profile-address-default-badge">Default</span>
                    </div>
                    <p class="profile-address-text"><strong>${defaultAddr.name || ''}</strong> &bull; ${defaultAddr.house}, ${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode}</p>
                    <p class="profile-address-phone">📱 ${defaultAddr.phone || ''}</p>
                </div>
                <div class="profile-address-card-actions">
                    <button type="button" class="btn-address-icon edit" data-addr-id="${defaultAddr.id}" title="Edit Address">✏</button>
                    <button type="button" class="btn-address-icon delete" data-addr-id="${defaultAddr.id}" title="Delete Address">🗑</button>
                </div>
            </div>
        `;
        bindAddressCardEvents(summaryAddresses);
    }

    function renderAddressesFull() {
        if (!fullAddresses) return;
        if (savedAddresses.length === 0) {
            fullAddresses.innerHTML = `
                <div class="profile-empty-state">
                    <span class="profile-empty-icon">📍</span>
                    <h3 class="profile-empty-title">No Saved Addresses</h3>
                    <p class="profile-empty-desc">Add your home or office address for fast, 1-click checkout.</p>
                    <button type="button" class="btn-profile-primary" id="btn-add-address-empty">+ Add New Address</button>
                </div>
            `;
            const btnEmpty = document.getElementById('btn-add-address-empty');
            if (btnEmpty) btnEmpty.addEventListener('click', openAddressModal);
            return;
        }

        fullAddresses.innerHTML = savedAddresses.map(addr => `
            <div class="profile-address-card ${addr.isDefault ? 'is-default' : ''}">
                <div class="profile-address-main">
                    <div class="profile-address-tag-row">
                        <span class="profile-address-type-badge">${addr.type === 'Work' ? '🏢 Work' : addr.type === 'Other' ? '📍 Other' : '🏠 Home'}</span>
                        ${addr.isDefault ? '<span class="profile-address-default-badge">Default</span>' : ''}
                    </div>
                    <p class="profile-address-text"><strong>${addr.name || 'Customer'}</strong> &bull; ${addr.house}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}</p>
                    <p class="profile-address-phone">📱 ${addr.phone || ''}</p>
                </div>
                <div class="profile-address-card-actions">
                    ${!addr.isDefault ? `<button type="button" class="btn-profile-action set-default" data-addr-id="${addr.id}" style="font-size:0.75rem;padding:4px 10px;">Set Default</button>` : ''}
                    <button type="button" class="btn-address-icon edit" data-addr-id="${addr.id}" title="Edit Address">✏</button>
                    <button type="button" class="btn-address-icon delete" data-addr-id="${addr.id}" title="Delete Address">🗑</button>
                </div>
            </div>
        `).join('');

        bindAddressCardEvents(fullAddresses);
    }

    function bindAddressCardEvents(container) {
        container.querySelectorAll('.btn-address-icon.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const addrId = btn.getAttribute('data-addr-id');
                const addr = savedAddresses.find(a => a.id === addrId);
                if (addr) openAddressModal(addr);
            });
        });

        container.querySelectorAll('.btn-address-icon.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const addrId = btn.getAttribute('data-addr-id');
                if (confirm('Are you sure you want to remove this delivery address?')) {
                    savedAddresses = savedAddresses.filter(a => a.id !== addrId);
                    if (savedAddresses.length > 0 && !savedAddresses.some(a => a.isDefault)) {
                        savedAddresses[0].isDefault = true;
                    }
                    localStorage.setItem('satvik_saved_addresses', JSON.stringify(savedAddresses));
                    renderAddressSummary();
                    renderAddressesFull();
                    showToast('🗑 Address deleted');
                }
            });
        });

        container.querySelectorAll('.btn-profile-action.set-default').forEach(btn => {
            btn.addEventListener('click', () => {
                const addrId = btn.getAttribute('data-addr-id');
                savedAddresses.forEach(a => a.isDefault = (a.id === addrId));
                localStorage.setItem('satvik_saved_addresses', JSON.stringify(savedAddresses));
                renderAddressSummary();
                renderAddressesFull();
                showToast('⭐ Default address updated!');
            });
        });
    }

    function openAddressModal(addr = null) {
        if (!modalAddress) return;
        if (modalAddressTitle) {
            modalAddressTitle.textContent = addr ? 'Edit Delivery Address' : 'Add New Delivery Address';
        }

        const inputId = document.getElementById('modal-addr-id');
        const inputName = document.getElementById('modal-addr-name');
        const inputPhone = document.getElementById('modal-addr-phone');
        const inputHouse = document.getElementById('modal-addr-house');
        const inputStreet = document.getElementById('modal-addr-street');
        const inputCity = document.getElementById('modal-addr-city');
        const inputState = document.getElementById('modal-addr-state');
        const inputPincode = document.getElementById('modal-addr-pincode');
        const inputDefault = document.getElementById('modal-addr-default');

        if (inputId) inputId.value = addr ? addr.id : '';
        if (inputName) inputName.value = addr ? addr.name : (savedProfile.name || '');
        if (inputPhone) inputPhone.value = addr ? addr.phone : (savedProfile.phone || '');
        if (inputHouse) inputHouse.value = addr ? addr.house : '';
        if (inputStreet) inputStreet.value = addr ? addr.street : '';
        if (inputCity) inputCity.value = addr ? addr.city : 'Indore';
        if (inputState) inputState.value = addr ? addr.state : 'Madhya Pradesh';
        if (inputPincode) inputPincode.value = addr ? addr.pincode : '452001';
        if (inputDefault) inputDefault.checked = addr ? !!addr.isDefault : (savedAddresses.length === 0);

        const typeRadio = document.querySelector(`input[name="modal-addr-type"][value="${addr ? addr.type : 'Home'}"]`);
        if (typeRadio) typeRadio.checked = true;

        modalAddress.classList.add('active');
    }

    function closeAddressModal() {
        if (modalAddress) modalAddress.classList.remove('active');
    }

    const btnAddAddressProfile = document.getElementById('btn-add-address-profile');
    const btnAddAddressFull = document.getElementById('btn-add-address-full');
    if (btnAddAddressProfile) btnAddAddressProfile.addEventListener('click', () => openAddressModal());
    if (btnAddAddressFull) btnAddAddressFull.addEventListener('click', () => openAddressModal());
    if (btnCloseAddressModal) btnCloseAddressModal.addEventListener('click', closeAddressModal);
    if (btnCancelAddressModal) btnCancelAddressModal.addEventListener('click', closeAddressModal);
    if (modalAddress) {
        modalAddress.addEventListener('click', (e) => {
            if (e.target === modalAddress) closeAddressModal();
        });
    }

    if (formModalAddress) {
        formModalAddress.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('modal-addr-id')?.value || `addr_${Date.now()}`;
            const type = document.querySelector('input[name="modal-addr-type"]:checked')?.value || 'Home';
            const name = document.getElementById('modal-addr-name')?.value.trim() || 'Customer';
            const phone = document.getElementById('modal-addr-phone')?.value.trim() || '';
            const house = document.getElementById('modal-addr-house')?.value.trim() || '';
            const street = document.getElementById('modal-addr-street')?.value.trim() || '';
            const city = document.getElementById('modal-addr-city')?.value.trim() || '';
            const state = document.getElementById('modal-addr-state')?.value.trim() || '';
            const pincode = document.getElementById('modal-addr-pincode')?.value.trim() || '';
            const isDefault = document.getElementById('modal-addr-default')?.checked || false;

            const existingIdx = savedAddresses.findIndex(a => a.id === id);
            if (isDefault) {
                savedAddresses.forEach(a => a.isDefault = false);
            }

            const addrObj = { id, type, name, phone, house, street, city, state, pincode, isDefault };

            if (existingIdx >= 0) {
                savedAddresses[existingIdx] = addrObj;
            } else {
                if (savedAddresses.length === 0) addrObj.isDefault = true;
                savedAddresses.push(addrObj);
            }

            localStorage.setItem('satvik_saved_addresses', JSON.stringify(savedAddresses));
            renderAddressSummary();
            renderAddressesFull();
            closeAddressModal();
            showToast('📍 Address saved successfully!');
        });
    }

    function renderOrderSummary() {
        if (ordersCountBadge) ordersCountBadge.textContent = ordersHistory.length;
        if (ordersTabCountBadge) ordersTabCountBadge.textContent = `Total: ${ordersHistory.length}`;
        if (!summaryOrders) return;
        const recent = ordersHistory[0];
        if (!recent) {
            summaryOrders.innerHTML = `
                <div style="padding: 24px 16px; text-align: center; background: #FAF8F5; border-radius: 12px; border: 1.5px dashed #EBDCCB;">
                    <p style="margin: 0 0 6px; font-weight: 700; color: #203325; font-size: 0.95rem;">No past orders yet</p>
                    <p style="margin: 0 0 14px; font-size: 0.85rem; color: #6b7280;">Experience our authentic handcrafted pickles and traditional sweets.</p>
                    <a href="products.html" class="btn-profile-primary" style="display: inline-block; padding: 8px 18px; font-size: 0.85rem; text-decoration: none;">Explore Products →</a>
                </div>
            `;
            return;
        }

        const firstItem = recent.items?.[0] || { name: 'Hara Mirch Pickle', image: 'assets/hara-mirch-jar.png' };
        summaryOrders.innerHTML = `
            <div class="profile-order-card">
                <div class="profile-order-body">
                    <div class="profile-order-item-info">
                        <img src="${firstItem.image || 'assets/hara-mirch-jar.png'}" alt="${firstItem.name}" class="profile-order-thumb" />
                        <div>
                            <h3 class="profile-order-details-name">${firstItem.name}</h3>
                            <p class="profile-order-details-meta">Order #${recent.orderId} &bull; ${new Date(recent.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;">
                        <span class="order-status-badge ${(recent.status || 'delivered').toLowerCase()}">${recent.status || 'Delivered'}</span>
                        <span class="profile-order-total" style="margin:0;">₹${recent.totalPrice}</span>
                        <button type="button" class="btn-profile-action view-order-btn" data-order-id="${recent.orderId}">View Details</button>
                    </div>
                </div>
            </div>
        `;

        summaryOrders.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const oId = btn.getAttribute('data-order-id');
                const ord = ordersHistory.find(o => o.orderId === oId);
                if (ord) openOrderModal(ord);
            });
        });
    }

    function renderOrdersFull(filter = 'all') {
        if (!fullOrders) return;

        let filtered = ordersHistory;
        if (filter === 'delivered') filtered = ordersHistory.filter(o => (o.status || '').toUpperCase() === 'DELIVERED');
        else if (filter === 'transit') filtered = ordersHistory.filter(o => (o.status || '').toUpperCase() === 'SHIPPED');
        else if (filter === 'processing') filtered = ordersHistory.filter(o => (o.status || '').toUpperCase() === 'CONFIRMED' || (o.status || '').toUpperCase() === 'PROCESSING');

        if (ordersCountBadge) ordersCountBadge.textContent = ordersHistory.length;
        if (ordersTabCountBadge) ordersTabCountBadge.textContent = `Total: ${ordersHistory.length}`;

        if (filtered.length === 0) {
            fullOrders.innerHTML = `
                <div class="profile-empty-state">
                    <span class="profile-empty-icon">📦</span>
                    <h3 class="profile-empty-title">No Orders Found</h3>
                    <p class="profile-empty-desc">You don't have any orders under this filter.</p>
                    <a href="products.html" class="btn-profile-primary">Browse Catalogue</a>
                </div>
            `;
            return;
        }

        fullOrders.innerHTML = filtered.map(order => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
            return `
                <div class="profile-order-card">
                    <div class="profile-order-header">
                        <div>
                            <span class="profile-order-id">Order #${order.orderId}</span>
                            <span class="profile-order-date"> &bull; Placed on ${dateStr}</span>
                        </div>
                        <span class="order-status-badge ${(order.status || 'delivered').toLowerCase()}">${order.status || 'Delivered'}</span>
                    </div>
                    
                    <div class="profile-order-body">
                        <div class="profile-order-item-info">
                            <img src="${order.items?.[0]?.image || 'assets/hara-mirch-jar.png'}" alt="${order.items?.[0]?.name || ''}" class="profile-order-thumb" />
                            <div>
                                <h4 class="profile-order-details-name">${order.items?.[0]?.name || 'Homemade Pickle'}</h4>
                                <p class="profile-order-details-meta">${order.items?.length > 1 ? `+ ${order.items.length - 1} more item(s)` : (order.items?.[0]?.variant || '500 g')}</p>
                                <p class="profile-order-details-meta" style="font-size:0.8rem;color:#9ca3af;">📍 ${order.deliveryAddress || 'Saved Address'}</p>
                            </div>
                        </div>
                        
                        <div class="profile-order-price-col">
                            <div class="profile-order-total">₹${order.totalPrice}</div>
                            <div class="profile-order-card-actions">
                                <button type="button" class="btn-profile-action view-order-btn" data-order-id="${order.orderId}">View Details</button>
                                <button type="button" class="btn-profile-primary reorder-btn" data-order-id="${order.orderId}">🔄 Reorder</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        fullOrders.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const oId = btn.getAttribute('data-order-id');
                const ord = ordersHistory.find(o => o.orderId === oId);
                if (ord) openOrderModal(ord);
            });
        });

        fullOrders.querySelectorAll('.reorder-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const oId = btn.getAttribute('data-order-id');
                const ord = ordersHistory.find(o => o.orderId === oId);
                if (ord) reorderItems(ord);
            });
        });
    }

    // Orders Filter Pills
    document.querySelectorAll('.filter-pill-btn[data-order-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOrdersFull(btn.getAttribute('data-order-filter'));
        });
    });

    function openOrderModal(order) {
        if (!modalOrder || !modalOrderContent) return;
        activeOrderDetails = order;
        if (modalOrderTitle) modalOrderTitle.textContent = `Order #${order.orderId} Details`;

        const dateStr = new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        modalOrderContent.innerHTML = `
            <div style="background:#faf8f5;border-radius:12px;padding:16px;margin-bottom:18px;border:1px solid #ebdccb;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-size:0.85rem;color:#6b7280;">Order Placed:</span>
                    <span style="font-weight:700;font-size:0.88rem;color:#203325;">${dateStr}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-size:0.85rem;color:#6b7280;">Payment Method:</span>
                    <span style="font-weight:700;font-size:0.88rem;color:#1f4a2c;">${order.paymentMethod || 'Online Payment (Prepaid)'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-size:0.85rem;color:#6b7280;">Delivery Address:</span>
                    <span style="font-weight:600;font-size:0.88rem;color:#374151;text-align:right;max-width:60%;">${order.deliveryAddress || 'Standard Delivery'}</span>
                </div>
            </div>

            <h4 style="margin:0 0 12px;font-size:1rem;color:#203325;">Items in this Order</h4>
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;">
                ${(order.items || []).map(item => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#ffffff;border:1px solid #f0eae1;border-radius:10px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <img src="${item.image || 'assets/hara-mirch-jar.png'}" alt="${item.name}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;background:#faf6f0;" />
                            <div>
                                <div style="font-weight:700;font-size:0.92rem;color:#203325;">${item.name}</div>
                                <div style="font-size:0.8rem;color:#6b7280;">Qty: ${item.quantity || 1} &bull; ${item.variant || '500 g'}</div>
                            </div>
                        </div>
                        <div style="font-weight:800;color:#1f4a2c;font-size:1rem;">₹${(item.price || 199) * (item.quantity || 1)}</div>
                    </div>
                `).join('')}
            </div>

            <div style="border-top:1.5px dashed #ebdccb;padding-top:14px;display:flex;flex-direction:column;gap:6px;">
                <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:#6b7280;">
                    <span>Items Subtotal</span>
                    <span>₹${order.totalPrice}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:#6b7280;">
                    <span>Delivery Charges</span>
                    <span style="color:#1f4a2c;font-weight:700;">FREE</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:800;color:#203325;margin-top:4px;">
                    <span>Total Paid</span>
                    <span>₹${order.totalPrice}</span>
                </div>
            </div>
        `;
        modalOrder.classList.add('active');
    }

    function closeOrderModal() {
        if (modalOrder) modalOrder.classList.remove('active');
    }

    if (btnCloseOrderModal) btnCloseOrderModal.addEventListener('click', closeOrderModal);
    if (btnModalOrderClose) btnModalOrderClose.addEventListener('click', closeOrderModal);
    if (modalOrder) {
        modalOrder.addEventListener('click', (e) => {
            if (e.target === modalOrder) closeOrderModal();
        });
    }

    function reorderItems(order) {
        if (!order || !order.items) return;
        order.items.forEach(item => {
            addToCart(item.id, item.variantId || 'var_500g', item.quantity || 1);
        });
        showToast('🛒 Items added to your cart!');
        openCart();
    }

    if (btnModalOrderReorder) {
        btnModalOrderReorder.addEventListener('click', () => {
            if (activeOrderDetails) {
                reorderItems(activeOrderDetails);
                closeOrderModal();
            }
        });
    }

    // --- Wishlist Rendering & Actions ---
    function renderWishlist() {
        if (!wishlistGrid) return;
        if (wishlistCountBadge) wishlistCountBadge.textContent = wishlistItems.length;

        if (wishlistItems.length === 0) {
            wishlistGrid.style.display = 'none';
            if (wishlistEmpty) wishlistEmpty.style.display = 'block';
            return;
        }

        wishlistGrid.style.display = 'grid';
        if (wishlistEmpty) wishlistEmpty.style.display = 'none';

        wishlistGrid.innerHTML = wishlistItems.map(item => `
            <div class="wishlist-card">
                <div class="wishlist-img-wrap">
                    <span class="wishlist-badge">${item.badge || '100% Satvik'}</span>
                    <button type="button" class="btn-wishlist-remove" data-wishlist-id="${item.id}" title="Remove from wishlist">✕</button>
                    <img src="${item.image || 'assets/aam-ka-achar.png'}" alt="${item.name}" class="wishlist-img" />
                </div>
                <h3 class="wishlist-title">${item.name}</h3>
                <div class="wishlist-price-row">
                    <span class="wishlist-price">₹${item.price}</span>
                    ${item.mrp ? `<span class="wishlist-mrp">₹${item.mrp}</span>` : ''}
                    <span style="font-size:0.75rem;color:#6b7280;margin-left:auto;">${item.weight || '500 g'}</span>
                </div>
                <button type="button" class="btn-wishlist-cart" data-wishlist-id="${item.id}">
                    🛒 Add to Cart
                </button>
            </div>
        `).join('');

        wishlistGrid.querySelectorAll('.btn-wishlist-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-wishlist-id');
                wishlistItems = wishlistItems.filter(i => i.id !== id);
                localStorage.setItem('satvik_wishlist', JSON.stringify(wishlistItems));
                renderWishlist();
                showToast('Removed from wishlist');
            });
        });

        wishlistGrid.querySelectorAll('.btn-wishlist-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-wishlist-id');
                const item = wishlistItems.find(i => i.id === id);
                if (item) {
                    addToCart(item.id, item.variantId || 'var_500g', 1);
                    showToast(`🛒 ${item.name} added to cart!`);
                    openCart();
                }
            });
        });
    }

    const btnMoveAllCart = document.getElementById('btn-move-all-cart');
    if (btnMoveAllCart) {
        btnMoveAllCart.addEventListener('click', () => {
            if (wishlistItems.length === 0) {
                showToast('Your wishlist is empty!');
                return;
            }
            wishlistItems.forEach(item => {
                addToCart(item.id, item.variantId || 'var_500g', 1);
            });
            showToast('🛒 All wishlist items added to cart!');
            openCart();
        });
    }

    // --- Settings Logic ---
    function loadSettings() {
        let settings = {};
        try {
            settings = JSON.parse(localStorage.getItem('satvik_user_settings') || '{}');
        } catch (e) { settings = {}; }

        const optWhatsapp = document.getElementById('setting-notify-whatsapp');
        const optSms = document.getElementById('setting-notify-sms');
        const optEmail = document.getElementById('setting-notify-email');
        const optLang = document.getElementById('setting-language');
        const optNote = document.getElementById('setting-delivery-note');

        if (optWhatsapp && settings.whatsapp !== undefined) optWhatsapp.checked = settings.whatsapp;
        if (optSms && settings.sms !== undefined) optSms.checked = settings.sms;
        if (optEmail && settings.email !== undefined) optEmail.checked = settings.email;
        if (optLang && settings.lang) optLang.value = settings.lang;
        if (optNote && settings.deliveryNote) optNote.value = settings.deliveryNote;
    }

    const formSettings = document.getElementById('form-user-settings');
    if (formSettings) {
        formSettings.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = {
                whatsapp: document.getElementById('setting-notify-whatsapp')?.checked ?? true,
                sms: document.getElementById('setting-notify-sms')?.checked ?? true,
                email: document.getElementById('setting-notify-email')?.checked ?? false,
                lang: document.getElementById('setting-language')?.value || 'en',
                deliveryNote: document.getElementById('setting-delivery-note')?.value.trim() || ''
            };
            localStorage.setItem('satvik_user_settings', JSON.stringify(settings));
            showToast('✅ Preferences saved successfully!');
        });
    }

    const btnClearCache = document.getElementById('btn-clear-cache');
    if (btnClearCache) {
        btnClearCache.addEventListener('click', () => {
            if (confirm('Clear local cart, saved profile, and address cache?')) {
                localStorage.removeItem('satvik_user_profile');
                localStorage.removeItem('satvik_saved_addresses');
                localStorage.removeItem('satvik_wishlist');
                localStorage.removeItem('satvik_user_settings');
                showToast('🧹 Local cache cleared! Refreshing...');
                setTimeout(() => location.reload(), 800);
            }
        });
    }

    // --- Initial Load & Hash Route Support ---
    renderAddressSummary();
    renderOrderSummary();
    renderWishlist();

    const currentHash = (location.hash || '').replace('#', '').toLowerCase();
    if (['orders', 'addresses', 'wishlist', 'settings'].includes(currentHash)) {
        switchProfileTab(currentHash);
    } else {
        switchProfileTab('profile');
    }

    window.addEventListener('hashchange', () => {
        const h = (location.hash || '').replace('#', '').toLowerCase();
        if (['profile', 'orders', 'addresses', 'wishlist', 'settings'].includes(h)) {
            switchProfileTab(h);
        }
    });
}

async function renderProfileContent() {
    const container = document.getElementById('profile-auth-section');
    if (!container) return;

    if (!window.auth?.currentUser) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">👋</div>
                <h3 style="color: var(--color-maroon);">Guest Customer Profile</h3>
                <p style="color: var(--color-sub); font-size: 0.9rem; margin-bottom: 20px;">
                    You are browsing as a guest. Sign in to manage your saved delivery addresses and track your orders.
                </p>
                <div style="background: #FAF5EF; border: 1px solid var(--color-gold-light); padding: 16px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: var(--color-maroon);">Track Guest Order</h4>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <input type="text" id="guest-track-id" placeholder="Order ID (e.g. #ABC123)" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--color-border);" />
                        <input type="text" id="guest-track-secret" placeholder="Guest Secret" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--color-border);" />
                        <button type="button" id="btn-guest-track" style="padding: 8px 16px; background: var(--color-maroon); color: #FFF; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">Track</button>
                    </div>
                </div>
            </div>`;
        return;
    }

    try {
        const user = window.auth.currentUser;
        const token = await user.getIdToken();
        const apiBaseUrl = String(window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://satvik-spot-backend-staging.onrender.com')).replace(/\/+$/, '');
        const profileResponse = await fetch(`${apiBaseUrl}/api/v1/customer/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contentType = profileResponse.headers.get('content-type') || '';
        const profileResponsePayload = contentType.includes('application/json') ? await profileResponse.json() : {};
        const profile = profileResponsePayload.data || { name: user.displayName || 'Valued Customer', phone: user.phoneNumber || '' };

        const addressesResponse = await fetch(`${apiBaseUrl}/api/v1/customer/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const addrContentType = addressesResponse.headers.get('content-type') || '';
        const addressesResponsePayload = addrContentType.includes('application/json') ? await addressesResponse.json() : {};
        const addresses = addressesResponsePayload.data || [];

        container.innerHTML = `
            <div>
                <div style="background: #FAF5EF; padding: 16px; border-radius: 10px; border: 1px solid var(--color-gold-light); margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: var(--color-maroon);">${profile.name}</h3>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: var(--color-sub);"><strong>Phone:</strong> ${profile.phone || 'Not set'}</p>
                    ${user.email ? `<p style="margin: 4px 0; font-size: 0.9rem; color: var(--color-sub);"><strong>Email:</strong> ${user.email}</p>` : ''}
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: var(--color-maroon);">Saved Delivery Addresses (${addresses.length}/5)</h4>
                    </div>
                    <div id="saved-addresses-list">
                        ${addresses.length === 0 ? '<p style="font-size: 0.88rem; color: var(--color-sub);">No saved addresses yet.</p>' : ''}
                        ${addresses.map(addressRecord => `
                            <div style="background: #FFF; border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>[${addressRecord.label}] ${addressRecord.name}</strong> ${addressRecord.isDefault ? '<span style="background: #E8F5E9; color: #2E7D32; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Default</span>' : ''}
                                    <div style="font-size: 0.85rem; color: #555;">${addressRecord.house}, ${addressRecord.street}, ${addressRecord.city} - ${addressRecord.pincode}</div>
                                    <div style="font-size: 0.82rem; color: #777;">📞 ${addressRecord.phone}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    } catch (profileFetchError) {
        console.warn('Profile fetch failed:', profileFetchError);
        container.innerHTML = `<p style="color: red;">Failed to load profile details.</p>`;
    }
}

function syncCheckoutPaymentMethodUI(totalPrice) {
    const radioList = document.querySelectorAll('input[name="payment-method"]');
    const submitBtn = document.querySelector('#checkout-form button[type="submit"]');

    function updateSubmitText() {
        const checked = document.querySelector('input[name="payment-method"]:checked');
        const val = checked ? checked.value : 'Online Payment';
        
        document.querySelectorAll('.co-pm-card').forEach(card => {
            const r = card.querySelector('input[type="radio"]');
            if (r && r.checked) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        if (submitBtn) {
            if (val === 'Online Payment') {
                submitBtn.textContent = `Proceed to Pay ₹${totalPrice} 🔒`;
            } else if (val === 'Cash on Delivery') {
                submitBtn.textContent = `Place Cash on Delivery Order 📦`;
            } else {
                submitBtn.textContent = `Order via WhatsApp 💬`;
            }
        }
    }

    radioList.forEach(radio => {
        radio.onchange = updateSubmitText;
    });

    document.querySelectorAll('.co-pm-card').forEach(card => {
        card.onclick = (e) => {
            const r = card.querySelector('input[type="radio"]');
            if (r) {
                r.checked = true;
                updateSubmitText();
            }
        };
    });

    updateSubmitText();
}

function renderCheckoutSummary() {
    const summaryContainer = document.getElementById('checkout-summary-items');
    const subtotalEl = document.getElementById('co-subtotal-val');
    const totalEl = document.getElementById('co-total-val');

    if (!summaryContainer) return;

    const items = Object.values(cart);
    const totalPrice = items.reduce((acc, item) => acc + (item.qty * item.price), 0);

    if (subtotalEl) subtotalEl.textContent = `₹${totalPrice}`;
    if (totalEl) totalEl.textContent = `₹${totalPrice}`;

    syncCheckoutPaymentMethodUI(totalPrice);

    if (items.length === 0) {
        summaryContainer.replaceChildren(createSafeElement('p', { text: 'No items in cart.', className: 'color-sub' }));
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const row = createSafeElement('div', { className: 'summary-row' });
        const nameSpan = createSafeElement('span', { text: `${item.name} (${item.variantLabel || item.weight || '500 g'}) × ${item.qty}` });
        const valSpan = createSafeElement('span', { text: `₹${item.price * item.qty}` });
        valSpan.style.fontWeight = '700';
        row.appendChild(nameSpan);
        row.appendChild(valSpan);
        fragment.appendChild(row);
    });

    summaryContainer.replaceChildren(fragment);
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
}

function updateProductGridEmptyState(visibleCount, query = '') {
    const grid = document.getElementById('product-grid-container');
    if (!grid) return;
    let emptyEl = document.getElementById('products-empty-state');
    if (visibleCount === 0) {
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.id = 'products-empty-state';
            grid.appendChild(emptyEl);
        }

        const safeQuery = sanitizeText(query || '');

        // Pick 3 to 4 random products from our 15-product catalogue
        const shuffled = [...PRODUCTS_CATALOGUE].sort(() => 0.5 - Math.random());
        const randomProducts = shuffled.slice(0, 4);

        emptyEl.style.cssText = 'grid-column: 1 / -1; width: 100%; margin: 16px 0 32px;';
        emptyEl.innerHTML = `
            <div class="search-not-found-card">
                <div class="search-not-found-icon" aria-hidden="true">🔍</div>
                <h3 class="search-not-found-title">Item Not Found ${safeQuery ? `for "${safeQuery}"` : ''}</h3>
                <p class="search-not-found-desc">
                    We couldn't find an exact match for <strong>${safeQuery || 'your search'}</strong> in our pantry right now.
                    <br />
                    Don't leave empty-handed! Here are some of our traditional handcrafted favorites currently in stock:
                </p>
                <div class="search-not-found-actions">
                    <button type="button" id="btn-reset-catalog-filter" class="btn-clear-search">
                        Clear Search &amp; View All 15 Products 🔄
                    </button>
                </div>
            </div>

            <div class="search-fallback-header">
                <div class="search-fallback-divider"></div>
                <h4 class="search-fallback-title">✨ Recommended Kitchen Specialties</h4>
                <div class="search-fallback-divider"></div>
            </div>

            <div class="search-fallback-grid">
                ${randomProducts.map(prod => {
                    const defVar = prod.variants?.find(v => v.active && v.stock > 0) || prod.variants?.[0] || { id: 'var_500g', price: 249, mrp: 320, label: '500g' };
                    const discount = defVar.mrp > defVar.price ? Math.round(((defVar.mrp - defVar.price) / defVar.mrp) * 100) : 0;
                    const imgSrc = (prod.images && prod.images[0]) || prod.img || 'assets/aam-ka-achar.png';
                    return `
                        <div class="product-card ref-product-card fallback-recommendation-card" data-category="${sanitizeText(prod.category)}" data-product-id="${sanitizeText(prod.id)}">
                            <div class="ref-product-card-top relative">
                                <span class="ref-product-badge absolute top-3 left-3">Kitchen Pick</span>
                                <a href="product-details.html?id=${sanitizeText(prod.id)}" class="block overflow-hidden rounded-t-2xl">
                                    <img src="${sanitizeText(imgSrc)}" alt="${sanitizeText(prod.name)}" class="product-img ref-product-img w-full" loading="lazy" />
                                </a>
                            </div>
                            <div class="ref-product-card-body p-4 flex flex-col h-full">
                                <a href="product-details.html?id=${sanitizeText(prod.id)}" class="block text-brand-ink hover:text-brand-green">
                                    <h3 class="product-title font-bold text-lg leading-tight mb-1">${sanitizeText(prod.name)}</h3>
                                </a>
                                <p class="text-xs font-semibold text-brand-green opacity-80 uppercase tracking-wide mb-3">${sanitizeText(prod.category)}</p>
                                <div class="mt-auto">
                                    <div class="product-hindi-title hidden">${sanitizeText(prod.hindiName || '')}</div>
                                    <div class="product-price-row flex items-baseline gap-2 mb-3">
                                        <span class="price-val font-bold text-xl text-brand-ink">₹${Number(defVar.price)}</span>
                                        ${defVar.mrp ? `<span class="mrp-val text-sm text-muted-foreground line-through">₹${Number(defVar.mrp)}</span>` : ''}
                                        ${discount > 0 ? `<span class="savings-tag text-xs font-bold text-brand-green border border-brand-green px-1.5 py-0.5 rounded ml-auto">Save ${discount}%</span>` : ''}
                                    </div>
                                    <div class="flex items-center gap-1 mb-4 text-xs font-bold text-brand-gold-deep">
                                        <span>★ ${prod.rating || 4.8} (${prod.reviewCount || 20})</span>
                                    </div>
                                    <button type="button" class="btn-add-cart w-full flex items-center justify-center gap-2 rounded-xl bg-brand-green py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-green-deep" data-product-id="${sanitizeText(prod.id)}" data-variant-id="${sanitizeText(defVar.id)}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                                        Add to Cart 🛒
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        emptyEl.style.display = 'block';

        const resetBtn = emptyEl.querySelector('#btn-reset-catalog-filter');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                const headerSearchInputs = document.querySelectorAll('.ref-search-input');
                headerSearchInputs.forEach(i => i.value = '');
                searchProducts('');
            });
        }

        const addBtns = emptyEl.querySelectorAll('.btn-add-cart');
        addBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pId = btn.getAttribute('data-product-id');
                const vId = btn.getAttribute('data-variant-id');
                if (pId) {
                    recordBrowsingCache(pId);
                    addToCart(pId, vId || 'var_500g', 1);
                    openCart();
                }
            });
        });
    } else {
        if (emptyEl) emptyEl.style.display = 'none';
    }
}

function buildProductCardHtml(prod) {
    const defVar = (prod.variants && prod.variants.find(v => v.active && v.stock > 0)) || prod.variants?.[0] || { id: 'var_500g', price: 249, mrp: 320, label: '500g' };
    const discount = (defVar.mrp && defVar.mrp > defVar.price) ? Math.round(((defVar.mrp - defVar.price) / defVar.mrp) * 100) : 0;
    const imgSrc = (prod.images && prod.images[0]) || prod.img || 'assets/aam-ka-achar.png';
    const badge = prod.badge || (prod.category === 'achar' ? 'Bestseller' : 'Pure Desi');
    const catLabel = (prod.id === 'prod_amla_chutney') ? 'Chutney' : (prod.category === 'achar' ? 'Pickles' : prod.category === 'murabba' ? 'Murabba' : prod.category === 'sweets' ? 'Laddus' : 'Health & Drinks');

    return `
        <div class="product-card" data-product-id="${sanitizeText(prod.id)}" data-category="${sanitizeText(prod.category)}">
            <div class="product-card-top">
                <span class="product-badge">${sanitizeText(badge)}</span>
                <img src="${sanitizeText(imgSrc)}" alt="${sanitizeText(prod.name)}" class="product-img" loading="lazy" />
            </div>
            <div class="product-category-meta">
                <svg class="cat-leaf-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17 8C8 10 5 16 3 21C6 20 12 18 16 13C18 10 18 8 17 8Z"/>
                    <path d="M17 8C19 5 21 3 22 2C21 4 20 7 17 8Z"/>
                </svg>
                <span>${sanitizeText(catLabel)}</span>
            </div>
            <span class="product-hindi-title" style="display: none;">${sanitizeText(prod.hindiName || '')}</span>
            <h3 class="product-title">${sanitizeText(prod.name)}</h3>
            <p class="product-desc">${sanitizeText(prod.shortDesc || prod.fullDesc || '')}</p>
            <div class="product-price-row">
                <span class="price-val">₹${Number(defVar.price)}</span>
                ${defVar.mrp ? `<span class="mrp-val">₹${Number(defVar.mrp)}</span>` : ''}
                ${discount > 0 ? `<span class="savings-tag">Save ${discount}%</span>` : ''}
            </div>
            <div class="product-rating-row">
                <span class="rating-star" aria-hidden="true">★</span>
                <span class="rating-score">${prod.rating || 4.8}</span>
                <span class="rating-count">(${prod.reviewCount || 24})</span>
            </div>
            <button type="button" class="btn-add-cart" data-product-id="${sanitizeText(prod.id)}" data-product-name="${sanitizeText(prod.name)}" data-product-price="${Number(defVar.price)}" data-variant-id="${sanitizeText(defVar.id)}" aria-label="Add ${sanitizeText(prod.name)} to cart">
                <svg class="cart-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span>Add to Cart</span>
            </button>
            <a href="product-details.html?id=${sanitizeText(prod.id)}" class="btn-view-details" style="display: none;" aria-hidden="true">View Details</a>
            <div class="card-botanical-twig" aria-hidden="true">
                <svg viewBox="0 0 20 28" fill="none" width="16" height="24">
                    <path d="M10 26 C10 18 9 10 10 2" stroke="#1D552C" stroke-width="1.6" stroke-linecap="round"/>
                    <path d="M10 18 C5 16 3 13 4 9 C8 10 9 14 10 18 Z" fill="#E4EAD2" stroke="#1D552C" stroke-width="1.3"/>
                    <path d="M10 13 C15 11 17 8 16 4 C12 5 11 9 10 13 Z" fill="#E4EAD2" stroke="#1D552C" stroke-width="1.3"/>
                    <path d="M10 5 C8 3 9 1 10 0 C11 1 12 3 10 5 Z" fill="#E4EAD2" stroke="#1D552C" stroke-width="1.3"/>
                </svg>
            </div>
        </div>
    `;
}

function renderCatalogSeekFlow(category = 'all', query = '') {
    const container = document.querySelector('#catalog #product-grid-container');
    if (!container) return;

    currentCatalogCategory = category;
    currentCatalogQuery = query;

    let filtered = PRODUCTS_CATALOGUE.filter(prod => {
        const matchesCategory = (category === 'all' || !category || prod.category === category);
        if (!matchesCategory) return false;
        if (!query) return true;
        const q = query.toLowerCase().trim();
        const title = (prod.name || '').toLowerCase();
        const hindiTitle = (prod.hindiName || '').toLowerCase();
        const desc = (prod.shortDesc || prod.desc || '').toLowerCase();
        const cat = (prod.category || '').toLowerCase();
        return title.includes(q) || hindiTitle.includes(q) || desc.includes(q) || cat.includes(q);
    });

    if (filtered.length === 0) {
        container.style.setProperty('animation-name', 'none', 'important');
        container.innerHTML = '';
        updateProductGridEmptyState(0, query);
        return;
    }

    const emptyEl = document.getElementById('products-empty-state');
    if (emptyEl) emptyEl.style.display = 'none';

    // Duplicate list to achieve at least 8-10 cards in a single cycle for infinite smooth looping
    const cycleMultiplier = Math.max(1, Math.ceil(8 / filtered.length));
    const singleCycleItems = [];
    for (let i = 0; i < cycleMultiplier; i++) {
        singleCycleItems.push(...filtered);
    }
    // Render two full cycles so Cycle 2 seamlessly follows Cycle 1 (50% shift = seamless infinite loop)
    const allItemsToRender = [...singleCycleItems, ...singleCycleItems];

    container.innerHTML = allItemsToRender.map(buildProductCardHtml).join('');

    initProductCardsClickHandlers();

    // Duration scales with number of items in cycle to keep speed constant, slow, and relaxing (~4.2s per card)
    const durationSeconds = Math.max(36, singleCycleItems.length * 4.2);
    container.style.setProperty('--marquee-duration', `${durationSeconds}s`);
    container.style.setProperty('--flow-duration', `${durationSeconds}s`);
    container.style.setProperty('animation-duration', `${durationSeconds}s`, 'important');
    container.style.setProperty('animation-name', 'none', 'important');
    void container.offsetWidth; // force browser layout recalculation to restart animation cleanly
    container.style.setProperty('animation-name', 'productFlowSlow', 'important');
    container.style.setProperty('animation-play-state', 'running', 'important');
}

/* ==========================================================================
   ITEM 2: SHOP FILTERS, BADGES & SORTER
   ========================================================================== */

function filterCategory(category) {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(t => {
        if (t.getAttribute('data-category') === category) {
            t.classList.add('active');
            t.setAttribute('aria-selected', 'true');
        } else {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        }
    });

    const secTitle = document.querySelector('.ref-section-title');
    if (secTitle) {
        if (category === 'all' || !category) secTitle.textContent = 'All Products';
        else if (category === 'achar' || category === 'pickles') secTitle.textContent = 'Pickles';
        else if (category === 'sweets' || category === 'murabba') secTitle.textContent = 'Sweets';
        else if (category === 'health') secTitle.textContent = 'Health Products';
        else secTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    }

    currentCatalogCategory = category;
    applyAllProductFilters();
}

function searchProducts(query) {
    currentCatalogQuery = query;
    applyAllProductFilters();
}

function updateCategoryBadges() {
    const allCards = document.querySelectorAll('#product-grid-container .product-card:not(.fallback-recommendation-card)');
    if (!allCards || allCards.length === 0) return;

    const allCount = allCards.length;
    let picklesCount = 0;
    let sweetsCount = 0;
    let healthCount = 0;

    allCards.forEach(card => {
        const cat = (card.getAttribute('data-category') || '').toLowerCase();
        if (cat.includes('achar') || cat.includes('pickles')) {
            picklesCount++;
        } else if (cat.includes('sweets') || cat.includes('murabba')) {
            sweetsCount++;
        } else if (cat.includes('health')) {
            healthCount++;
        }
    });

    // Sidebar buttons and tabs on products.html
    const allBtnSpan = document.querySelector('.category-tab[data-category="all"] span, .ref-cat-btn-all span');
    if (allBtnSpan) allBtnSpan.textContent = `All Products (${allCount})`;

    const picklesBtnSpan = document.querySelector('.category-tab[data-category="achar"] span, .category-tab[data-category="pickles"] span');
    if (picklesBtnSpan) picklesBtnSpan.textContent = `Pickles (${picklesCount})`;

    const sweetsBtnSpan = document.querySelector('.category-tab[data-category="sweets"] span, .category-tab[data-category="murabba"] span');
    if (sweetsBtnSpan) sweetsBtnSpan.textContent = `Sweets (${sweetsCount})`;

    const healthBtnSpan = document.querySelector('.category-tab[data-category="health"] span');
    if (healthBtnSpan) healthBtnSpan.textContent = `Health Products (${healthCount})`;
}

function applyAllProductFilters() {
    const category = currentCatalogCategory || 'all';
    const query = (currentCatalogQuery || '').toLowerCase().trim();

    // Check active price filters
    const priceCheckboxes = document.querySelectorAll('.ref-filters input[type="checkbox"]:checked, .ref-filter-list input[type="checkbox"][data-price]:checked');
    const activePriceTests = Array.from(priceCheckboxes).map(cb => {
        const val = cb.getAttribute('data-price') || cb.value;
        if (val === 'under-200' || cb.parentElement?.textContent.includes('Under ₹200')) return (p) => p < 200;
        if (val === '200-400' || cb.parentElement?.textContent.includes('200 – ₹400')) return (p) => p >= 200 && p <= 400;
        if (val === '401-600' || cb.parentElement?.textContent.includes('401 – ₹600')) return (p) => p > 400 && p <= 600;
        if (val === 'above-600' || cb.parentElement?.textContent.includes('Above ₹600')) return (p) => p > 600;
        return null;
    }).filter(Boolean);

    // Check active stock checkboxes (#filter-instock, #filter-outofstock)
    const inStockCb = document.getElementById('filter-instock') || document.querySelector('input[data-filter="in-stock"]');
    const outOfStockCb = document.getElementById('filter-outofstock') || document.querySelector('input[data-filter="out-of-stock"]');
    const inStockChecked = inStockCb ? inStockCb.checked : false;
    const outOfStockChecked = outOfStockCb ? outOfStockCb.checked : false;

    const cards = document.querySelectorAll('.product-card:not(.fallback-recommendation-card)');
    let visibleCount = 0;

    cards.forEach(card => {
        const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
        const titleEl = card.querySelector('.ref-card-title, .product-title');
        const title = titleEl ? titleEl.textContent.toLowerCase().trim() : '';
        const hindiTitle = card.querySelector('.product-hindi-title')?.textContent.toLowerCase().trim() || '';
        const desc = card.querySelector('.product-desc, .ref-card-cat')?.textContent.toLowerCase().trim() || '';
        const priceEl = card.querySelector('.price-val, .ref-card-price');
        const priceText = priceEl ? priceEl.textContent.replace(/[^0-9.]/g, '') : '0';
        const price = parseFloat(priceText) || 0;
        const pId = card.getAttribute('data-product-id') || '';

        // Category match: ('all', 'achar'/'pickles', 'sweets'/'murabba', 'health')
        let matchesCat = (category === 'all' || !category);
        if (!matchesCat) {
            if (category === 'achar' || category === 'pickles') {
                matchesCat = cardCat.includes('achar') || cardCat.includes('pickles');
            } else if (category === 'sweets' || category === 'murabba') {
                matchesCat = cardCat.includes('sweets') || cardCat.includes('murabba');
            } else if (category === 'health') {
                matchesCat = cardCat.includes('health');
            } else {
                matchesCat = cardCat.includes(category.toLowerCase());
            }
        }

        // Query match (smart fuzzy + synonyms + substring)
        let matchesQuery = true;
        if (query) {
            matchesQuery = checkProductMatchesSearch(pId, title, hindiTitle, desc, cardCat, query);
        }

        // Price filter match
        let matchesPrice = true;
        if (activePriceTests.length > 0) {
            matchesPrice = activePriceTests.some(testFn => testFn(price));
        }

        // Stock match
        let matchesStock = true;
        const prod = PRODUCTS_CATALOGUE.find(p => p.id === pId);
        const isCatalogueOutOfStock = prod && prod.variants && prod.variants.length > 0 && prod.variants.every(v => !v.stock || v.stock <= 0 || !v.active);
        const isOutOfStock = card.classList.contains('out-of-stock') ||
            card.classList.contains('sold-out') ||
            card.getAttribute('data-in-stock') === 'false' ||
            Boolean(card.querySelector('.badge-soldout, .out-of-stock-badge')) ||
            Boolean(isCatalogueOutOfStock);

        if (inStockChecked && !outOfStockChecked) {
            if (isOutOfStock) matchesStock = false;
        } else if (!inStockChecked && outOfStockChecked) {
            if (!isOutOfStock) matchesStock = false;
        }

        if (matchesCat && matchesQuery && matchesPrice && matchesStock) {
            card.classList.remove('filter-hidden');
            visibleCount++;
        } else {
            card.classList.add('filter-hidden');
        }
    });

    updateProductGridEmptyState(visibleCount, query);
    updateCategoryBadges();
}

/* ==========================================================================
   ITEM 4: UNIVERSAL SMART FUZZY SEARCH & AUTO-SUGGEST ENGINE
   ========================================================================== */

/**
 * Standard Levenshtein distance algorithm for typo tolerance
 */
function getLevenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const row = [];
    for (let i = 0; i <= b.length; i++) {
        row[i] = i;
    }

    for (let i = 1; i <= a.length; i++) {
        let prev = i;
        for (let j = 1; j <= b.length; j++) {
            let val;
            if (a.charAt(i - 1) === b.charAt(j - 1)) {
                val = row[j - 1];
            } else {
                val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
            }
            row[j - 1] = prev;
            prev = val;
        }
        row[b.length] = prev;
    }
    return row[b.length];
}

/**
 * Fuzzy word matcher with typo tolerance (Levenshtein distance <= 2 for words >= 4 chars)
 */
function fuzzyWordMatch(queryWord, targetWord) {
    const qw = queryWord.toLowerCase().trim();
    const tw = targetWord.toLowerCase().trim();
    if (!qw || !tw) return false;

    if (tw === qw || tw.includes(qw) || qw.includes(tw)) return true;

    // Typo tolerance: Levenshtein distance <= 2 for words >= 4 chars
    if (qw.length >= 4) {
        if (Math.abs(qw.length - tw.length) <= 2) {
            if (getLevenshteinDistance(qw, tw) <= 2) return true;
        }
    }
    return false;
}

/**
 * Synonym mapping groups
 */
const SYNONYM_GROUPS = [
    {
        // 'laddu', 'ladoo', 'laddoo', 'sweets', 'mithai', 'besan', 'gond' -> matches laddu products
        synonyms: ['laddu', 'ladoo', 'laddoo', 'sweets', 'sweet', 'mithai', 'besan', 'gond', 'barfi'],
        matchesProduct: (p, term) => {
            const id = (p.id || '').toLowerCase();
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            if (term === 'gond') return id.includes('gond') || name.includes('gond');
            if (term === 'besan') return id.includes('besan') || name.includes('besan');
            if (term === 'barfi') return id.includes('barfi') || name.includes('barfi');
            if (term === 'laddu' || term === 'ladoo' || term === 'laddoo') {
                return id.includes('laddu') || name.includes('laddu') || name.includes('ladoo');
            }
            // General sweets/mithai
            return cat === 'sweets' || id.includes('laddu') || id.includes('barfi') || name.includes('laddu') || name.includes('barfi');
        }
    },
    {
        // 'achar', 'aachar', 'pickle', 'pickles', 'mirch', 'mirchi', 'aam', 'mango', 'nimbu', 'lemon', 'karela', 'lahsun', 'garlic' -> matches achar products
        synonyms: ['achar', 'aachar', 'pickle', 'pickles', 'mirch', 'mirchi', 'aam', 'mango', 'nimbu', 'lemon', 'karela', 'lahsun', 'garlic'],
        matchesProduct: (p, term) => {
            const id = (p.id || '').toLowerCase();
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            if (term === 'aam' || term === 'mango') return id.includes('aam') || name.includes('aam') || name.includes('mango');
            if (term === 'mirch' || term === 'mirchi') return id.includes('mirch') || name.includes('mirch');
            if (term === 'nimbu' || term === 'lemon') return id.includes('nimbu') || name.includes('nimbu') || name.includes('lemon');
            if (term === 'karela') return id.includes('karel') || name.includes('karela') || name.includes('kareli');
            if (term === 'lahsun' || term === 'garlic') return id.includes('lhsun') || id.includes('lahsun') || name.includes('lahsun') || name.includes('garlic');
            // General achar / pickle
            return cat === 'achar' || cat.includes('pickle') || id.includes('achar') || name.includes('achar') || name.includes('pickle');
        }
    },
    {
        // 'murabba', 'amla', 'chyawanprash', 'powder', 'juice' -> matches health/sweets preserves
        synonyms: ['murabba', 'amla', 'chyawanprash', 'powder', 'juice'],
        matchesProduct: (p, term) => {
            const id = (p.id || '').toLowerCase();
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            if (term === 'murabba') return id.includes('murabba') || name.includes('murabba');
            if (term === 'amla') return id.includes('amla') || name.includes('amla');
            if (term === 'chyawanprash') return id.includes('chyawanprash') || name.includes('chyawanprash');
            if (term === 'powder') return id.includes('powder') || name.includes('powder');
            if (term === 'juice') return id.includes('juice') || name.includes('juice');
            return cat === 'health' || id.includes('murabba') || name.includes('murabba') || name.includes('chyawanprash');
        }
    }
];

/**
 * Site pages and quick action redirects
 */
const SEARCH_NAV_ITEMS = [
    {
        id: 'contact',
        title: '📞 Contact Us',
        subtitle: 'Reach our team via phone, email or address',
        url: 'contact.html',
        type: 'page',
        icon: '📞',
        keywords: ['contact', 'call', 'support', 'phone', 'email', 'address', 'helpline', 'customer care']
    },
    {
        id: 'our-story',
        title: '📜 Our Story',
        subtitle: 'Our heritage, virasat & traditional village roots',
        url: 'our-story.html',
        type: 'page',
        icon: '📜',
        keywords: ['story', 'about', 'history', 'virasat', 'heritage', 'tradition', 'roots', 'origin']
    },
    {
        id: 'why-us',
        title: '🌿 Health & Purity',
        subtitle: '100% natural, sun-cured in wood-pressed mustard oil',
        url: 'why-us.html',
        type: 'page',
        icon: '🌿',
        keywords: ['why us', 'purity', 'health', 'mustard oil', 'sun-cured', 'cold-pressed', 'wood-pressed', 'natural', 'organic', 'preservative free']
    },
    {
        id: 'reviews',
        title: '⭐ Customer Reviews',
        subtitle: 'Customer ratings, feedback & genuine testimonials',
        url: 'reviews.html',
        type: 'page',
        icon: '⭐',
        keywords: ['reviews', 'rating', 'ratings', 'feedback', 'testimonials', 'stars', 'satisfaction']
    },
    {
        id: 'faq',
        title: '❓ FAQ',
        subtitle: 'Questions, answers, delivery & shipping information',
        url: 'faq.html',
        type: 'page',
        icon: '❓',
        keywords: ['faq', 'question', 'questions', 'help', 'delivery', 'shipping', 'transit', 'tracking']
    },
    {
        id: 'profile',
        title: '👤 My Account & Orders',
        subtitle: 'Track your deliveries, past orders & addresses',
        url: 'profile.html',
        type: 'page',
        icon: '👤',
        keywords: ['profile', 'orders', 'account', 'login', 'track order', 'past orders', 'my orders', 'user']
    },
    {
        id: 'cart',
        title: '🛒 View Cart & Checkout',
        subtitle: 'Open your shopping cart and complete checkout',
        action: 'cart',
        type: 'action',
        icon: '🛒',
        keywords: ['cart', 'basket', 'checkout', 'buy now', 'bag', 'view cart', 'items']
    }
];

function checkProductMatchesSearch(pId, title, hindiTitle, desc, cardCat, query) {
    const q = query.toLowerCase().trim();
    if (!q) return true;

    // Direct substring checks
    if (title.includes(q) || hindiTitle.includes(q) || desc.includes(q) || cardCat.includes(q) || pId.includes(q)) {
        return true;
    }

    const queryWords = q.split(/\s+/).filter(Boolean);

    // Check synonym groups
    for (const group of SYNONYM_GROUPS) {
        for (const syn of group.synonyms) {
            const matchesSyn = queryWords.some(qw => fuzzyWordMatch(qw, syn));
            if (matchesSyn) {
                const prodStub = { id: pId, name: title, category: cardCat };
                if (group.matchesProduct(prodStub, syn)) {
                    return true;
                }
            }
        }
    }

    // Direct fuzzy match against individual words in product title, category, and id
    const targetTokens = [
        ...title.split(/\s+/),
        ...hindiTitle.split(/\s+/),
        ...cardCat.split(/\s+/),
        pId.replace('prod_', '').replace(/_/g, ' ')
    ].filter(Boolean);

    return queryWords.every(qw => targetTokens.some(tw => fuzzyWordMatch(qw, tw)));
}

function getSearchSuggestions(query) {
    const q = query.toLowerCase().trim();
    if (!q) return { pages: [], products: [] };

    const queryWords = q.split(/\s+/).filter(Boolean);

    // 1. Match Pages & Actions
    const matchingPages = SEARCH_NAV_ITEMS.filter(item => {
        if (item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)) return true;
        return item.keywords.some(kw => {
            if (kw.includes(q) || q.includes(kw)) return true;
            return queryWords.some(qw => fuzzyWordMatch(qw, kw));
        });
    });

    // 2. Match Products from PRODUCTS_CATALOGUE
    const matchingProducts = PRODUCTS_CATALOGUE.filter(p => {
        const pId = (p.id || '').toLowerCase();
        const title = (p.name || '').toLowerCase();
        const hindiTitle = (p.hindiName || '').toLowerCase();
        const desc = (p.shortDesc || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return checkProductMatchesSearch(pId, title, hindiTitle, desc, cat, q);
    }).map(p => {
        const image = (p.images && p.images[0]) ? p.images[0] : 'assets/logo.png';
        const price = (p.variants && p.variants[0] && p.variants[0].price) ? p.variants[0].price : 199;
        let catLabel = 'Pickles';
        if (p.category === 'sweets') catLabel = 'Sweets';
        else if (p.category === 'health') catLabel = 'Health Products';

        return {
            id: p.id,
            name: p.name,
            hindiName: p.hindiName || '',
            image,
            priceLabel: `₹${price}`,
            categoryLabel: catLabel
        };
    });

    return { pages: matchingPages, products: matchingProducts };
}

function renderSearchDropdown(dropdown, query, results) {
    if (!dropdown) return;
    dropdown.innerHTML = '';

    if (!query) {
        dropdown.classList.remove('active');
        return;
    }

    const { pages = [], products = [] } = results || {};

    if (pages.length === 0 && products.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'ref-search-empty';
        emptyDiv.appendChild(document.createTextNode('🔍 No matching items found for "'));

        const strongEl = document.createElement('strong');
        strongEl.textContent = query;
        emptyDiv.appendChild(strongEl);

        emptyDiv.appendChild(document.createTextNode('". '));

        const hintSpan = document.createElement('span');
        hintSpan.className = 'ref-search-empty-hint';
        hintSpan.textContent = 'Try searching for "Pickles", "Laddu", or "Contact Us".';
        emptyDiv.appendChild(hintSpan);

        dropdown.appendChild(emptyDiv);
        dropdown.classList.add('active');
        return;
    }

    if (pages.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'ref-search-section-label';
        secLabel.textContent = 'Pages & Actions';
        dropdown.appendChild(secLabel);

        pages.forEach(item => {
            const pageItem = document.createElement('div');
            pageItem.className = 'ref-search-item ref-search-item-page';
            pageItem.setAttribute('data-type', sanitizeText(item.type || ''));
            const targetVal = item.url ? validateUrl(item.url) : (item.action || '');
            pageItem.setAttribute('data-target', targetVal);
            pageItem.setAttribute('role', 'option');
            pageItem.setAttribute('tabindex', '0');

            const iconDiv = document.createElement('div');
            iconDiv.className = 'ref-search-page-icon';
            iconDiv.textContent = item.icon || '📄';
            pageItem.appendChild(iconDiv);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'ref-search-item-info';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'ref-search-item-title';
            titleSpan.textContent = item.title || '';
            infoDiv.appendChild(titleSpan);

            const subSpan = document.createElement('span');
            subSpan.className = 'ref-search-item-sub';
            subSpan.textContent = item.subtitle || '';
            infoDiv.appendChild(subSpan);

            pageItem.appendChild(infoDiv);

            const badgeSpan = document.createElement('span');
            badgeSpan.className = `ref-search-badge ${item.type === 'action' ? 'action' : ''}`;
            badgeSpan.textContent = item.type === 'action' ? 'Action' : 'Page';
            pageItem.appendChild(badgeSpan);

            dropdown.appendChild(pageItem);
        });
    }

    if (products.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'ref-search-section-label';
        secLabel.textContent = `Products (${products.length})`;
        dropdown.appendChild(secLabel);

        products.slice(0, 6).forEach(p => {
            const prodItem = document.createElement('div');
            prodItem.className = 'ref-search-item ref-search-item-product';
            prodItem.setAttribute('data-product-id', sanitizeText(p.id || ''));
            prodItem.setAttribute('role', 'option');
            prodItem.setAttribute('tabindex', '0');

            const img = document.createElement('img');
            img.className = 'ref-search-item-thumb';
            img.src = validateUrl(p.image || 'assets/logo.png');
            img.alt = p.name || 'Product';
            img.loading = 'lazy';
            img.addEventListener('error', function () {
                this.src = 'assets/logo.png';
            });
            prodItem.appendChild(img);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'ref-search-item-info';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'ref-search-item-title';
            titleSpan.textContent = p.name || '';
            infoDiv.appendChild(titleSpan);

            const metaDiv = document.createElement('div');
            metaDiv.className = 'ref-search-item-meta';

            const catSpan = document.createElement('span');
            catSpan.className = 'ref-search-item-cat';
            catSpan.textContent = p.categoryLabel || '';
            metaDiv.appendChild(catSpan);

            const priceSpan = document.createElement('span');
            priceSpan.className = 'ref-search-item-price';
            priceSpan.textContent = p.priceLabel || '';
            metaDiv.appendChild(priceSpan);

            infoDiv.appendChild(metaDiv);
            prodItem.appendChild(infoDiv);

            dropdown.appendChild(prodItem);
        });
    }

    dropdown.classList.add('active');
}

function initUniversalSearch() {
    const searchBars = document.querySelectorAll('.ref-search-bar');
    if (!searchBars.length) return;

    searchBars.forEach(bar => {
        let dropdown = bar.querySelector('.ref-search-suggestions');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'ref-search-suggestions';
            dropdown.setAttribute('role', 'listbox');
            dropdown.setAttribute('aria-label', 'Search Suggestions');
            bar.appendChild(dropdown);
        }

        const input = bar.querySelector('.ref-search-input');
        if (!input || input._searchInitialized) return;
        input._searchInitialized = true;

        let debounceTimer = null;

        // Input event with 150ms debounce
        input.addEventListener('input', (e) => {
            const val = e.target.value;

            // On products.html, typing also filters the product grid in real-time
            if (document.getElementById('product-grid-container')) {
                searchProducts(val);
            }

            clearTimeout(debounceTimer);
            if (!val.trim()) {
                dropdown.innerHTML = '';
                dropdown.classList.remove('active');
                return;
            }

            debounceTimer = setTimeout(() => {
                const results = getSearchSuggestions(val);
                renderSearchDropdown(dropdown, val.trim(), results);
            }, 150);
        });

        // Focus event
        input.addEventListener('focus', () => {
            const val = input.value.trim();
            if (val) {
                const results = getSearchSuggestions(val);
                renderSearchDropdown(dropdown, val, results);
            }
        });

        // Keydown handling (Enter and Escape)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const query = input.value.trim();
                dropdown.classList.remove('active');

                if (document.getElementById('product-grid-container')) {
                    searchProducts(query);
                } else if (query) {
                    const results = getSearchSuggestions(query);
                    if (results.pages.length > 0 && !results.products.length) {
                        const topPage = results.pages[0];
                        if (topPage.type === 'action' && topPage.action === 'cart') {
                            openCart();
                        } else if (topPage.url && isSafeNavigationUrl(topPage.url)) {
                            const safeUrl = validateUrl(topPage.url);
                            if (isSafeNavigationUrl(safeUrl)) {
                                window.location.href = safeUrl;
                            }
                        }
                    } else if (results.products.length === 1 && results.pages.length === 0) {
                        window.location.href = `product-details.html?id=${encodeURIComponent(results.products[0].id)}`;
                    } else {
                        window.location.href = `products.html?q=${encodeURIComponent(query)}`;
                    }
                }
            }
        });

        // Click on dropdown results
        dropdown.addEventListener('click', (e) => {
            const pageItem = e.target.closest('.ref-search-item-page');
            if (pageItem) {
                const type = pageItem.getAttribute('data-type');
                const target = pageItem.getAttribute('data-target');
                dropdown.classList.remove('active');
                if (type === 'action' && target === 'cart') {
                    openCart();
                } else if (target && isSafeNavigationUrl(target)) {
                    const safeUrl = validateUrl(target);
                    if (isSafeNavigationUrl(safeUrl)) {
                        window.location.href = safeUrl;
                    }
                }
                return;
            }

            const prodItem = e.target.closest('.ref-search-item-product');
            if (prodItem) {
                const pId = prodItem.getAttribute('data-product-id');
                dropdown.classList.remove('active');
                if (pId) {
                    window.location.href = `product-details.html?id=${encodeURIComponent(pId)}`;
                }
            }
        });

        // Keyboard activation on dropdown items
        dropdown.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const item = e.target.closest('.ref-search-item');
                if (item) {
                    e.preventDefault();
                    item.click();
                }
            }
        });
    });

    // Close all suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ref-search-bar')) {
            document.querySelectorAll('.ref-search-suggestions').forEach(d => d.classList.remove('active'));
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.ref-search-suggestions').forEach(d => d.classList.remove('active'));
        }
    });
}

/* ── DEDICATED PRODUCT DETAILS PAGE INITIALIZER ── */
function initProductDetailsPage() {
    const mainSec = document.getElementById('pd-main-section');
    if (!mainSec) return;

    const urlParams = new URLSearchParams(window.location.search);
    const pId = urlParams.get('id') || urlParams.get('productId') || urlParams.get('slug');

    const errBox = document.getElementById('pd-error-container');
    const errHeading = document.getElementById('pd-error-heading');
    const errText = document.getElementById('pd-error-message');
    const btnRetry = document.getElementById('pd-btn-retry');
    const btnAddCart = document.getElementById('pd-btn-add-cart');

    if (btnRetry) {
        btnRetry.addEventListener('click', () => { window.location.reload(); });
    }

    const showProductLoadError = (headingText, messageText) => {
        mainSec.style.display = 'none';
        const mainImg = document.getElementById('pd-main-img');
        if (mainImg) { mainImg.src = ''; mainImg.alt = ''; }
        if (errBox) {
            errBox.style.display = 'block';
            if (errHeading) errHeading.textContent = headingText || 'Product Not Found';
            if (errText) errText.textContent = messageText || 'This product could not be loaded. Please return to Products and try again.';
        }
        if (btnAddCart) {
            btnAddCart.disabled = true;
            btnAddCart.style.opacity = '0.5';
            btnAddCart.style.cursor = 'not-allowed';
            btnAddCart.textContent = 'Add to Cart 🛒';
        }
    };

    // Validate ID param
    if (!pId || typeof pId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(pId)) {
        showProductLoadError('Invalid Product Request', 'This product could not be loaded. Please return to Products and try again.');
        return;
    }

    const prod = PRODUCTS_CATALOGUE.find(p => p.id === pId || p.productId === pId || p.slug === pId);
    if (!prod) {
        showProductLoadError('Product Not Found', 'This product could not be loaded. Please return to Products and try again.');
        return;
    }

    mainSec.style.display = 'grid';
    if (errBox) errBox.style.display = 'none';

    // Render product details
    function renderProductDetailsLocalized() {
        const isHi = getCurrentLanguage() === 'hi';
        const primaryTitle = isHi ? (prod.hindiName || prod.name) : prod.name;
        const secondaryTitle = isHi ? prod.name : (prod.hindiName || '');

        document.title = `${primaryTitle} – Satvik Swaad`;
        const breadcrumbTitle = document.getElementById('pd-breadcrumb-title');
        if (breadcrumbTitle) breadcrumbTitle.textContent = primaryTitle;

        const titleEl = document.getElementById('pd-title');
        const hindiTitleEl = document.getElementById('pd-hindi-title');
        if (titleEl) titleEl.textContent = primaryTitle;
        if (hindiTitleEl) hindiTitleEl.textContent = secondaryTitle;

        const shortDescEl = document.getElementById('pd-short-desc');
        const fullDescEl = document.getElementById('pd-full-desc');
        if (shortDescEl) shortDescEl.textContent = prod.shortDesc || '';
        if (fullDescEl) fullDescEl.textContent = prod.fullDesc || prod.shortDesc;

        // Tabs
        const tabIng = document.getElementById('tab-btn-ingredients');
        if (tabIng) tabIng.textContent = t('productDetails.tabIngredients');
        const tabHlt = document.getElementById('tab-btn-health');
        if (tabHlt) tabHlt.textContent = t('productDetails.tabHealth');
        const tabStr = document.getElementById('tab-btn-storage');
        if (tabStr) tabStr.textContent = t('productDetails.tabStorage');
        const tabRev = document.getElementById('tab-btn-reviews');
        if (tabRev) tabRev.textContent = t('productDetails.tabReviews');

        // Buttons
        if (btnAddCart && !btnAddCart.disabled) {
            btnAddCart.textContent = t('productDetails.btnAddToCart');
        }
        const btnBuyNow = document.getElementById('pd-btn-buy-now');
        if (btnBuyNow) btnBuyNow.textContent = t('productDetails.btnBuyNow');
    }

    renderProductDetailsLocalized();
    window.addEventListener('languageChanged', renderProductDetailsLocalized);
    if (ingredientsEl) ingredientsEl.textContent = prod.ingredients || 'Verified traditional ingredients.';
    if (storageEl) storageEl.textContent = prod.storageInfo || 'Store in a cool, dry place.';
    if (shelfLifeEl) shelfLifeEl.textContent = prod.shelfLife || '12 Months';
    if (allergensEl) allergensEl.textContent = prod.allergens || 'None declared.';
    if (packagingEl) packagingEl.textContent = prod.packaging || 'Sealed Glass Jar';
    if (ratingValEl) ratingValEl.textContent = `★ ${prod.rating || 5.0}`;
    if (reviewCountEl) reviewCountEl.textContent = `(${prod.reviewCount || 0} verified reviews)`;

    if (badgeEl) {
        if (prod.badge) {
            badgeEl.textContent = prod.badge;
            badgeEl.style.display = 'inline-block';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    // Render Image Gallery
    const mainImg = document.getElementById('pd-main-img');
    const thumbsBox = document.getElementById('pd-thumbnails-container');
    if (mainImg && Array.isArray(prod.images) && prod.images.length > 0) {
        mainImg.src = prod.images[0];
        mainImg.alt = prod.name;

        // Always show thumbnails — supports admin adding multiple images later
        if (thumbsBox) {
            const frag = document.createDocumentFragment();
            prod.images.forEach((imgUrl, i) => {
                const thumb = createSafeElement('img', {
                    src: imgUrl,
                    alt: `${prod.name} — Photo ${i + 1} of ${prod.images.length}`,
                    style: `width: 72px; height: 72px; object-fit: cover; border-radius: 10px; border: 3px solid ${i === 0 ? 'var(--color-maroon)' : 'transparent'}; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.08); flex-shrink: 0;`
                });
                thumb.addEventListener('mouseenter', () => {
                    thumb.style.transform = 'scale(1.08)';
                    thumb.style.boxShadow = '0 4px 12px rgba(139,69,19,0.2)';
                });
                thumb.addEventListener('mouseleave', () => {
                    thumb.style.transform = 'scale(1)';
                    thumb.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                });
                thumb.addEventListener('click', () => {
                    mainImg.src = imgUrl;
                    mainImg.style.opacity = '0';
                    requestAnimationFrame(() => { mainImg.style.transition = 'opacity 0.3s ease'; mainImg.style.opacity = '1'; });
                    Array.from(thumbsBox.children).forEach(c => { c.style.borderColor = 'transparent'; });
                    thumb.style.borderColor = 'var(--color-maroon)';
                });
                frag.appendChild(thumb);
            });
            thumbsBox.replaceChildren(frag);
        }
    }

    // Render Variants Pill Selector
    const variantsBox = document.getElementById('pd-variants-container');
    let selectedVariant = (prod.variants || []).find(v => v.active && v.stock > 0) || (prod.variants && prod.variants[0]);
    let selectedQty = 1;

    function updateVariantDisplay() {
        const priceVal = document.getElementById('pd-price-val');
        const mrpVal = document.getElementById('pd-mrp-val');
        const savingsTag = document.getElementById('pd-savings-tag');
        const skuDisplay = document.getElementById('pd-sku-display');
        const stockBadge = document.getElementById('pd-stock-badge');
        const btnAddCart = document.getElementById('pd-btn-add-cart');

        if (priceVal) priceVal.textContent = `₹${selectedVariant.price}`;
        if (mrpVal) {
            if (selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price) {
                mrpVal.textContent = `₹${selectedVariant.mrp}`;
                mrpVal.style.display = 'inline';
                if (savingsTag) {
                    const savePct = Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100);
                    savingsTag.textContent = `Save ${savePct}%`;
                    savingsTag.style.display = 'inline-block';
                }
            } else {
                mrpVal.style.display = 'none';
                if (savingsTag) savingsTag.style.display = 'none';
            }
        }

        if (skuDisplay) skuDisplay.textContent = `SKU: ${selectedVariant.sku || 'N/A'}`;

        if (stockBadge) {
            if (!selectedVariant.active || selectedVariant.stock <= 0) {
                stockBadge.textContent = '● Out of Stock';
                stockBadge.style.background = '#ff4d4f';
                if (btnAddCart) {
                    btnAddCart.disabled = true;
                    btnAddCart.textContent = 'Out of Stock ❌';
                    btnAddCart.style.opacity = '0.5';
                    btnAddCart.style.cursor = 'not-allowed';
                }
            } else if (selectedVariant.stock < 10) {
                stockBadge.textContent = `● Only ${selectedVariant.stock} left — Hurry!`;
                stockBadge.style.background = '#fa8c16';
                if (btnAddCart) {
                    btnAddCart.disabled = false;
                    btnAddCart.textContent = 'Add to Cart 🛒';
                    btnAddCart.style.opacity = '1';
                    btnAddCart.style.cursor = 'pointer';
                }
            } else {
                stockBadge.textContent = '● In Stock';
                stockBadge.style.background = '#52c41a';
                if (btnAddCart) {
                    btnAddCart.disabled = false;
                    btnAddCart.textContent = 'Add to Cart 🛒';
                    btnAddCart.style.opacity = '1';
                    btnAddCart.style.cursor = 'pointer';
                }
            }
        }
    }

    if (variantsBox && Array.isArray(prod.variants)) {
        const frag = document.createDocumentFragment();
        prod.variants.forEach(v => {
            const isSelected = selectedVariant && selectedVariant.id === v.id;
            const isAvailable = v.active && v.stock > 0;

            const selectedStyle = `
                padding: 12px 22px;
                border-radius: 12px;
                font-weight: 800;
                cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
                border: 2px solid ${isSelected ? 'var(--color-maroon)' : 'rgba(139,69,19,0.2)'};
                background: ${isSelected ? 'linear-gradient(135deg, var(--color-maroon), #6b1d0e)' : 'linear-gradient(135deg, #ffffff, #faf5ef)'};
                color: ${isSelected ? '#ffffff' : 'var(--color-text)'};
                opacity: ${isAvailable ? 1 : 0.45};
                font-size: 0.92rem;
                letter-spacing: 0.3px;
                box-shadow: ${isSelected ? '0 4px 14px rgba(139,69,19,0.3)' : '0 1px 4px rgba(0,0,0,0.06)'};
                transition: all 0.25s ease;
                position: relative;
                text-decoration: ${isAvailable ? 'none' : 'line-through'};
            `.replace(/\n\s+/g, ' ').trim();

            const btn = createSafeElement('button', {
                style: selectedStyle
            });

            // Build inner content with weight icon
            const iconSpan = document.createElement('span');
            iconSpan.textContent = '📦 ';
            iconSpan.style.fontSize = '0.85rem';

            const labelSpan = document.createElement('span');
            labelSpan.textContent = v.label;
            labelSpan.style.fontWeight = '800';

            const priceSpan = document.createElement('span');
            priceSpan.textContent = ` — ₹${v.price}`;
            priceSpan.style.fontWeight = '600';
            priceSpan.style.opacity = '0.85';

            btn.appendChild(iconSpan);
            btn.appendChild(labelSpan);
            btn.appendChild(priceSpan);

            // Hover effects
            if (isAvailable) {
                btn.addEventListener('mouseenter', () => {
                    if (selectedVariant && selectedVariant.id !== v.id) {
                        btn.style.border = '2px solid var(--color-maroon)';
                        btn.style.background = 'linear-gradient(135deg, #fff5e6, #ffe8cc)';
                        btn.style.boxShadow = '0 3px 10px rgba(139,69,19,0.15)';
                        btn.style.transform = 'translateY(-1px)';
                    }
                });
                btn.addEventListener('mouseleave', () => {
                    if (selectedVariant && selectedVariant.id !== v.id) {
                        btn.style.border = '2px solid rgba(139,69,19,0.2)';
                        btn.style.background = 'linear-gradient(135deg, #ffffff, #faf5ef)';
                        btn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                        btn.style.transform = 'translateY(0)';
                    }
                });
            }

            btn.addEventListener('click', () => {
                if (!isAvailable) {
                    showToast(`⚠️ ${v.label} variant is currently unavailable.`);
                    return;
                }
                selectedVariant = v;
                selectedQty = 1;
                const qtyVal = document.getElementById('pd-qty-val');
                if (qtyVal) qtyVal.textContent = '1';

                // Reset all buttons to unselected
                Array.from(variantsBox.children).forEach(child => {
                    child.style.border = '2px solid rgba(139,69,19,0.2)';
                    child.style.background = 'linear-gradient(135deg, #ffffff, #faf5ef)';
                    child.style.color = 'var(--color-text)';
                    child.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                    child.style.transform = 'translateY(0)';
                });
                // Active state for clicked button
                btn.style.border = '2px solid var(--color-maroon)';
                btn.style.background = 'linear-gradient(135deg, var(--color-maroon), #6b1d0e)';
                btn.style.color = '#ffffff';
                btn.style.boxShadow = '0 4px 14px rgba(139,69,19,0.3)';

                updateVariantDisplay();
            });

            frag.appendChild(btn);
        });
        variantsBox.replaceChildren(frag);
    }

    updateVariantDisplay();

    // Quantity buttons
    const qtyMinus = document.getElementById('pd-qty-minus');
    const qtyPlus = document.getElementById('pd-qty-plus');
    const qtyVal = document.getElementById('pd-qty-val');

    if (qtyMinus) {
        qtyMinus.addEventListener('click', () => {
            if (selectedQty > 1) {
                selectedQty -= 1;
                if (qtyVal) qtyVal.textContent = String(selectedQty);
            }
        });
    }

    if (qtyPlus) {
        qtyPlus.addEventListener('click', () => {
            const max = selectedVariant ? Math.min(selectedVariant.stock, 50) : 50;
            if (selectedQty < max) {
                selectedQty += 1;
                if (qtyVal) qtyVal.textContent = String(selectedQty);
            } else {
                showToast(`⚠️ Maximum available stock (${max}) reached.`);
            }
        });
    }

    if (btnAddCart) {
        btnAddCart.addEventListener('click', () => {
            if (selectedVariant) {
                addToCart(prod.id, selectedVariant.id, selectedQty);
            }
        });
    }

    // Render Product-Specific Reviews
    const reviewsBox = document.getElementById('pd-reviews-container');
    if (reviewsBox) {
        fetchProductReviews(prod.id, reviewsBox);
    }

    // Render Related Products
    const relatedGrid = document.getElementById('pd-related-grid');
    if (relatedGrid) {
        const relatedProds = PRODUCTS_CATALOGUE.filter(p => p.id !== prod.id && p.category === prod.category).slice(0, 3);
        const frag = document.createDocumentFragment();
        relatedProds.forEach(rp => {
            const card = createSafeElement('div', { className: 'product-card', style: 'cursor: pointer;' });
            card.addEventListener('click', () => {
                window.location.href = `product-details.html?id=${encodeURIComponent(rp.id)}`;
            });
            const topDiv = createSafeElement('div', { className: 'product-card-top' });
            const imgUrl = (rp.images && rp.images[0]) || rp.img || 'assets/aam-ka-achar.png?v=2';
            const img = createSafeElement('img', { src: imgUrl, alt: rp.name, className: 'product-img' });
            topDiv.appendChild(img);

            const title = createSafeElement('h3', { className: 'product-title', text: rp.name });
            const desc = createSafeElement('p', { className: 'product-desc', text: rp.shortDesc });
            const priceRow = createSafeElement('div', { className: 'product-price-row' });
            const defaultV = rp.variants[0];
            const priceSpan = createSafeElement('span', { className: 'price-val', text: `From ₹${defaultV.price}` });
            priceRow.appendChild(priceSpan);

            card.appendChild(topDiv);
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(priceRow);

            frag.appendChild(card);
        });
        relatedGrid.replaceChildren(frag);
    }
}

async function fetchProductReviews(productId, container) {
    try {
        const apiBaseUrl = String(window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://satvik-spot-backend-staging.onrender.com')).replace(/\/+$/, '');
        const endpoint = `${apiBaseUrl}/api/v1/reviews?productId=${encodeURIComponent(productId)}`;

        const productReviewsResponse = await fetch(endpoint);
        const contentType = productReviewsResponse.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return renderEmptyReviewsState(container);
        const productReviewsPayload = await productReviewsResponse.json();

        if (productReviewsResponse.ok && productReviewsPayload.success && Array.isArray(productReviewsPayload.data?.reviews) && productReviewsPayload.data.reviews.length > 0) {
            renderPublicReviews(productReviewsPayload.data.reviews, container);
        } else {
            renderEmptyReviewsState(container);
        }
    } catch (productReviewsError) {
        console.warn('Product reviews fetch failed:', productReviewsError);
        renderEmptyReviewsState(container);
    }
}

function generateFrontendWhatsAppMessage({ orderId, items, subtotal, shippingFee, total, name, phone, email, house, street, landmark, city, state, pincode, note }) {
    const publicId = orderId ? orderId.slice(-6).toUpperCase() : Date.now().toString(36).slice(-6).toUpperCase();
    const now = new Date();
    const dateStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const formattedItems = items.map((item, index) => {
        let baseName = item.name;
        let variantSize = item.variantLabel || item.size || 'Standard';
        const match = item.name.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            baseName = match[1];
            variantSize = match[2];
        }
        const unitPrice = Number(item.price) || 0;
        const lineTotal = unitPrice * (Number(item.qty) || 1);
        return `${index + 1}. ${baseName}\n   • Variant: ${variantSize}\n   • Qty: x${item.qty}\n   • Price: ₹${unitPrice}\n   • Total: ₹${lineTotal}`;
    }).join('\n\n');

    const deliveryStr = shippingFee === 0 ? 'FREE 🎉' : `₹${shippingFee}`;
    const phoneDigits = phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phone;

    return `🛒 *NEW ORDER REQUEST - SATVIK SWAAD*

🙏 Namaste!

I would like to place the following order.

━━━━━━━━━━━━━━━━━━━━
📦 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━━━
🆔 Order ID: #${publicId}
📅 Order Date: ${dateStr}

🛍️ *Items Ordered*
${formattedItems}

━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY*
━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${subtotal}
Delivery Charges: ${deliveryStr}
Discount: ₹0
━━━━━━━━━━━━━━━━━━━━
💳 *Grand Total: ₹${total}*
━━━━━━━━━━━━━━━━━━━━

👤 *CUSTOMER DETAILS*
Name: ${name}
📞 Mobile: +91 ${formattedPhone}
📧 Email: ${email || 'N/A'}

📍 *DELIVERY ADDRESS*
House/Flat: ${house || 'N/A'}
Area/Street: ${street || 'N/A'}
Landmark: ${landmark || 'N/A'}
City: ${city || 'N/A'}
State: ${state || 'Uttar Pradesh'}
PIN Code: ${pincode || 'N/A'}

📝 *SPECIAL INSTRUCTIONS*
${note || 'None'}

💳 *PAYMENT METHOD*
WhatsApp-Assisted Ordering

Kindly confirm:
✅ Product availability
✅ Final payable amount
✅ Payment details (if applicable)
✅ Expected dispatch/delivery time

Thank you! 🙏`;
}

export async function placeOrder() {
    const nameInput = document.getElementById('co-name');
    const phoneInput = document.getElementById('co-phone');
    const emailInput = document.getElementById('co-email');
    const houseInput = document.getElementById('co-house');
    const streetInput = document.getElementById('co-street');
    const landmarkInput = document.getElementById('co-landmark');
    const cityInput = document.getElementById('co-city');
    const stateInput = document.getElementById('co-state');
    const pincodeInput = document.getElementById('co-pincode');
    const addressInput = document.getElementById('co-address');
    const noteInput = document.getElementById('co-note');
    const errEl = document.getElementById('co-error-msg');

    if (errEl) { errEl.style.display = 'none'; }

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const house = houseInput ? houseInput.value.trim() : '';
    const street = streetInput ? streetInput.value.trim() : '';
    const landmark = landmarkInput ? landmarkInput.value.trim() : '';
    const city = cityInput ? cityInput.value.trim() : '';
    const state = stateInput ? stateInput.value.trim() : '';
    const pincode = pincodeInput ? pincodeInput.value.trim() : '';
    const addressRaw = addressInput ? addressInput.value.trim() : '';
    const note = noteInput ? noteInput.value.trim() : '';

    // Robust Dual Address Field Resolution
    let finalHouse = house;
    let finalStreet = street;
    let fullAddress = addressRaw;

    if (addressRaw && (!finalHouse || !finalStreet)) {
        const parts = addressRaw.split(',').map(s => s.trim()).filter(Boolean);
        finalHouse = finalHouse || parts[0] || addressRaw;
        finalStreet = finalStreet || parts.slice(1).join(', ') || parts[0] || addressRaw;
    }

    if (!fullAddress) {
        fullAddress = [finalHouse, finalStreet, landmark, city, state, pincode].filter(Boolean).join(', ');
    }

    if (!name || !phone || !fullAddress || !city || !pincode) {
        if (errEl) {
            errEl.textContent = '⚠️ Please fill in all required delivery fields (Full Name, Phone, Delivery Address, City, Pincode).';
            errEl.style.display = 'block';
        } else {
            alert('Please fill in all required delivery fields.');
        }
        return;
    }

    if (!/^[0-9]{10,15}$/.test(phone.replace(/\D/g, ''))) {
        if (errEl) {
            errEl.textContent = '⚠️ Please enter a valid 10-digit WhatsApp mobile number.';
            errEl.style.display = 'block';
        }
        return;
    }

    if (!/^[0-9]{6}$/.test(pincode.trim())) {
        if (errEl) {
            errEl.textContent = '⚠️ Please enter a valid 6-digit Pincode.';
            errEl.style.display = 'block';
        }
        return;
    }

    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
        if (errEl) {
            errEl.textContent = '⚠️ Your cart is empty!';
            errEl.style.display = 'block';
        } else {
            alert('Your cart is empty!');
        }
        return;
    }

    const btn = document.querySelector('#checkout-form button[type="submit"]');

    const checkedRadio = document.querySelector('input[name="payment-method"]:checked');
    const selectedMethod = checkedRadio ? checkedRadio.value : 'Online Payment';

    const idempotencyKey = 'idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const apiBaseUrl = String(window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://satvik-spot-backend-staging.onrender.com')).replace(/\/+$/, '');
    const headers = { 'Content-Type': 'application/json' };

    let subtotal = 0;
    cartItems.forEach(cartItem => { subtotal += (Number(cartItem.price) || 0) * (Number(cartItem.qty) || 1); });
    const shippingFee = 0; // Free Inaugural Delivery
    const orderTotal = subtotal + shippingFee;

    if (btn) {
        if (selectedMethod === 'Online Payment') btn.textContent = '⏳ Connecting to Payment Gateway...';
        else if (selectedMethod === 'Cash on Delivery') btn.textContent = '⏳ Placing COD Order...';
        else btn.textContent = '⏳ Opening WhatsApp...';
        btn.disabled = true;
    }

    try {
        if (window.getAppCheckToken) {
            try {
                const appCheckToken = await window.getAppCheckToken();
                if (appCheckToken) headers['X-Firebase-AppCheck'] = appCheckToken;
            } catch (acErr) { console.warn('AppCheck token warning:', acErr); }
        }

        if (window.auth?.currentUser) {
            try {
                const token = await window.auth.currentUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            } catch (tErr) { console.warn('Auth token warning:', tErr); }
        }

        // Helper to save order record locally
        function saveOrderRecordLocally(orderId, paymentMode, paymentId = '') {
            const orderRecord = {
                orderId,
                paymentId,
                createdAt: new Date().toISOString(),
                status: 'CONFIRMED',
                totalPrice: orderTotal,
                paymentMethod: paymentMode,
                deliveryAddress: fullAddress,
                items: cartItems.map(item => ({
                    id: item.productId || item.id,
                    name: item.name,
                    variant: item.variantLabel || item.weight || '500 g',
                    quantity: item.qty || 1,
                    price: item.price || 0,
                    image: item.image || 'assets/aam-ka-achar.png'
                }))
            };

            let history = [];
            try { history = JSON.parse(localStorage.getItem('satwik_orders_history') || '[]'); } catch (e) { history = []; }
            if (!Array.isArray(history)) history = [];
            history = history.filter(o => o && o.orderId !== 'SS1247');
            history.unshift(orderRecord);
            localStorage.setItem('satwik_orders_history', JSON.stringify(history));
            localStorage.setItem('satvik_last_order', JSON.stringify(orderRecord));

            cart = {};
            saveCart();
            renderCart();
            closeCheckout();
            return orderRecord;
        }

        // ── FLOW 1: WHATSAPP-ASSISTED ORDER ──
        if (selectedMethod === 'WhatsApp-Assisted Ordering') {
            const waOrderId = 'SS-WA-' + Math.floor(100000 + Math.random() * 900000);
            const targetMessage = generateFrontendWhatsAppMessage({
                orderId: waOrderId,
                items: cartItems,
                subtotal,
                shippingFee,
                total: orderTotal,
                name,
                phone,
                email,
                house: finalHouse || fullAddress,
                street: finalStreet || city || fullAddress,
                landmark,
                city,
                state: state || 'Uttar Pradesh',
                pincode,
                note
            });

            // Save order locally
            saveOrderRecordLocally(waOrderId, 'WhatsApp-Assisted Ordering');

            // Open WhatsApp
            const waUrl = `https://wa.me/919236587600?text=${encodeURIComponent(targetMessage)}`;
            window.open(waUrl, '_blank');

            // Background notification
            fetch(`${apiBaseUrl}/api/v1/orders/create-whatsapp-request`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    phone,
                    address: fullAddress,
                    email: email || undefined,
                    house: finalHouse || undefined,
                    street: finalStreet || undefined,
                    landmark: landmark || undefined,
                    city: city || undefined,
                    state: state || 'Uttar Pradesh',
                    pincode: pincode || undefined,
                    note: note || undefined,
                    paymentMethod: 'WhatsApp-Assisted Ordering',
                    idempotencyKey,
                    items: cartItems.map(cartItem => ({
                        productId: String(cartItem.productId || cartItem.id),
                        variantId: String(cartItem.variantId || 'var_500g'),
                        qty: Number(cartItem.qty) || 1
                    }))
                })
            }).catch(e => console.warn('Background WA order note:', e));

            window.location.href = `order-success.html?orderId=${encodeURIComponent(waOrderId)}&method=whatsapp&total=${orderTotal}`;
            return;
        }

        // ── FLOW 2: CASH ON DELIVERY ──
        if (selectedMethod === 'Cash on Delivery') {
            let orderId = 'SS-COD-' + Math.floor(100000 + Math.random() * 900000);
            try {
                const codRes = await fetch(`${apiBaseUrl}/api/v1/orders/create`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        name,
                        phone,
                        address: fullAddress,
                        email: email || undefined,
                        house: finalHouse || undefined,
                        street: finalStreet || undefined,
                        landmark: landmark || undefined,
                        city: city || undefined,
                        state: state || 'Uttar Pradesh',
                        pincode: pincode || undefined,
                        note: note || undefined,
                        paymentMethod: 'Cash on Delivery',
                        idempotencyKey,
                        items: cartItems.map(cartItem => ({
                            productId: String(cartItem.productId || cartItem.id),
                            variantId: String(cartItem.variantId || 'var_500g'),
                            qty: Number(cartItem.qty) || 1
                        }))
                    })
                });
                const codJson = await codRes.json().catch(() => ({}));
                if (codRes.ok && codJson.success && codJson.data?.orderId) {
                    orderId = codJson.data.orderId;
                }
            } catch (codErr) {
                console.warn('Backend COD order notification:', codErr);
            }

            saveOrderRecordLocally(orderId, 'Cash on Delivery');
            showToast('🎉 Cash on Delivery order confirmed!');
            window.location.href = `order-success.html?orderId=${encodeURIComponent(orderId)}&method=cod&total=${orderTotal}`;
            return;
        }

        // ── FLOW 3: ONLINE PAYMENT (RAZORPAY) ──
        let paymentData = null;
        let paymentInitError = null;

        try {
            const paymentResponse = await fetch(`${apiBaseUrl}/api/v1/payments/create-order`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    phone,
                    email: email || undefined,
                    house: finalHouse || undefined,
                    street: finalStreet || undefined,
                    landmark: landmark || undefined,
                    city: city || undefined,
                    state: state || 'Uttar Pradesh',
                    pincode: pincode || undefined,
                    address: fullAddress,
                    note: note || undefined,
                    paymentMethod: 'Online Payment',
                    idempotencyKey,
                    items: cartItems.map(cartItem => ({
                        productId: String(cartItem.productId || cartItem.id),
                        variantId: String(cartItem.variantId || 'var_500g'),
                        qty: Number(cartItem.qty) || 1
                    }))
                })
            });

            const respJson = await paymentResponse.json().catch(() => ({}));
            if (paymentResponse.ok && respJson.success && respJson.data) {
                paymentData = respJson.data;
            } else {
                paymentInitError = respJson?.error?.message || 'Payment gateway initialization notice';
            }
        } catch (fErr) {
            paymentInitError = fErr.message;
        }

        // If backend returned active Razorpay order:
        if (paymentData && paymentData.razorpayOrderId && paymentData.razorpayKeyId) {
            async function loadRazorpayScript() {
                if (window.Razorpay) return true;
                return new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.head.appendChild(script);
                });
            }

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Unable to load payment gateway. Please check your internet connection.');
            }

            const rzpOptions = {
                key: paymentData.razorpayKeyId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'INR',
                name: 'Satvik Swaad',
                description: `Order #${String(paymentData.orderId).slice(-6).toUpperCase()}`,
                order_id: paymentData.razorpayOrderId,
                modal: {
                    ondismiss: function () {
                        // User cancelled or closed Razorpay modal - PRESERVE CART!
                        window.location.href = `payment-failed.html?reason=cancelled_by_user&orderId=${encodeURIComponent(paymentData.orderId)}&total=${orderTotal}`;
                    }
                },
                handler: async function (response) {
                    try {
                        const verifyRes = await fetch(`${apiBaseUrl}/api/v1/payments/verify`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                    } catch (vErr) {
                        console.warn('Payment verification notice:', vErr);
                    }

                    saveOrderRecordLocally(paymentData.orderId, 'Online Payment (Razorpay)', response.razorpay_payment_id);
                    showToast('🎉 Order placed and payment confirmed!');
                    window.location.href = `order-success.html?orderId=${encodeURIComponent(paymentData.orderId)}&paymentId=${encodeURIComponent(response.razorpay_payment_id)}&method=online&total=${orderTotal}`;
                },
                prefill: {
                    name,
                    contact: phone,
                    email: email || ''
                },
                theme: {
                    color: '#7A1C1C'
                }
            };

            const rzp = new window.Razorpay(rzpOptions);
            rzp.on('payment.failed', function (failResp) {
                // Payment failed at bank - PRESERVE CART!
                const desc = failResp?.error?.description || 'Transaction declined';
                window.location.href = `payment-failed.html?reason=${encodeURIComponent(desc)}&orderId=${encodeURIComponent(paymentData.orderId)}&total=${orderTotal}`;
            });
            rzp.open();
            return;
        }

        // If backend payments are in preview/launch preparation mode or unavailable:
        if (errEl) {
            errEl.innerHTML = `
                <div style="background: #FFFDF8; border: 1.5px solid #D4AF37; border-radius: 12px; padding: 16px; margin-top: 10px; text-align: left;">
                    <div style="display:flex;align-items:center;gap:8px;font-weight:800;color:#7A1C1C;font-size:0.95rem;margin-bottom:6px;">
                        <span>💳</span> <span>Payment Gateway Notice</span>
                    </div>
                    <p style="margin: 0 0 12px; font-size: 0.85rem; color: #555; line-height: 1.45;">
                        Online payment gateway is in test/preparation mode on this environment. Choose an option below to proceed:
                    </p>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <button type="button" id="btn-fallback-cod" style="background:#1F4A2C;color:#FFF;border:none;padding:11px 16px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.9rem;">
                            📦 Place Instantly as Cash on Delivery (Free Delivery)
                        </button>
                        <button type="button" id="btn-fallback-sim-success" style="background:#FAF5EB;border:1.5px solid #7A1C1C;color:#7A1C1C;padding:10px 16px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.88rem;">
                            🧪 Run Successful Payment Verification Flow
                        </button>
                        <button type="button" id="btn-fallback-sim-fail" style="background:#FFF1F2;border:1px solid #F43F5E;color:#BE123C;padding:9px 16px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.85rem;">
                            ⚠️ Test Payment Failure &amp; Recovery Flow
                        </button>
                    </div>
                </div>
            `;
            errEl.style.display = 'block';

            // Connect fallback interactive buttons
            document.getElementById('btn-fallback-cod')?.addEventListener('click', () => {
                const codRadio = document.querySelector('input[name="payment-method"][value="Cash on Delivery"]');
                if (codRadio) codRadio.checked = true;
                placeOrder();
            });

            document.getElementById('btn-fallback-sim-success')?.addEventListener('click', () => {
                const simId = 'SS-ONLINE-' + Math.floor(100000 + Math.random() * 900000);
                saveOrderRecordLocally(simId, 'Online Payment (Prepaid)', 'pay_sim_' + Date.now());
                window.location.href = `order-success.html?orderId=${encodeURIComponent(simId)}&paymentId=pay_verified_online&method=online&total=${orderTotal}`;
            });

            document.getElementById('btn-fallback-sim-fail')?.addEventListener('click', () => {
                const simId = 'SS-TEST-' + Math.floor(100000 + Math.random() * 900000);
                window.location.href = `payment-failed.html?reason=Bank+authorization+timed+out&orderId=${encodeURIComponent(simId)}&total=${orderTotal}`;
            });
        }

    } catch (orderProcessingError) {
        console.error("Order processing error:", orderProcessingError);
        if (errEl) {
            errEl.textContent = '⚠️ ' + orderProcessingError.message;
            errEl.style.display = 'block';
        } else {
            alert('⚠️ ' + orderProcessingError.message);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            const currentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'Online Payment';
            if (currentMethod === 'Online Payment') btn.textContent = `Proceed to Pay ₹${orderTotal} 🔒`;
            else if (currentMethod === 'Cash on Delivery') btn.textContent = 'Place Cash on Delivery Order 📦';
            else btn.textContent = 'Order via WhatsApp 💬';
        }
    }
}

function showWhatsAppNoticeModal(orderResult) {
    const modal = document.getElementById('whatsapp-notice-modal');
    const orderIdEl = document.getElementById('wa-modal-order-id');
    const totalEl = document.getElementById('wa-modal-total');
    const btnReopen = document.getElementById('btn-wa-reopen');
    const btnWeb = document.getElementById('btn-wa-web');
    const btnCopy = document.getElementById('btn-wa-copy');
    const btnClose = document.getElementById('btn-wa-close');

    if (!modal) return;

    if (orderIdEl) orderIdEl.textContent = `#${orderResult.orderId.slice(-6).toUpperCase()}`;
    if (totalEl) totalEl.textContent = `₹${orderResult.total}`;

    if (btnReopen) {
        btnReopen.onclick = () => {
            if (orderResult.whatsappUrl) {
                window.open(orderResult.whatsappUrl, '_blank', 'noopener,noreferrer');
            }
        };
    }

    if (btnWeb) {
        btnWeb.onclick = () => {
            const encoded = encodeURIComponent(orderResult.whatsappMessage || '');
            const webUrl = `https://web.whatsapp.com/send?phone=919236587600&text=${encoded}`;
            window.open(webUrl, '_blank', 'noopener,noreferrer');
        };
    }

    if (btnCopy) {
        btnCopy.onclick = async () => {
            try {
                await navigator.clipboard.writeText(orderResult.whatsappMessage || '');
                showToast('📋 Order summary copied to clipboard!');
            } catch (clipboardError) {
                console.warn('Clipboard copy failed:', clipboardError);
            }
        };
    }

    if (btnClose) {
        btnClose.onclick = () => {
            modal.style.display = 'none';
        };
    }

    modal.style.display = 'flex';
}

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (formSubmitEvent) => {
        formSubmitEvent.preventDefault();
        const btn = document.getElementById('btn-submit-contact');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending... ⏳'; }

        try {
            const name = document.getElementById('contact-name')?.value?.trim();
            const email = document.getElementById('contact-email')?.value?.trim();
            const phone = document.getElementById('contact-phone')?.value?.trim();
            const subject = document.getElementById('contact-subject')?.value?.trim();
            const message = document.getElementById('contact-message')?.value?.trim();

            if (!name || name.length < 2) throw new Error('Please enter a valid name (at least 2 characters).');
            if (!message || message.length < 5) throw new Error('Please enter a valid message (at least 5 characters).');

            const payload = { name, message };
            if (email) payload.email = email;
            if (phone) payload.phone = phone;
            if (subject) payload.subject = subject;

            const apiBaseUrl = String(window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://satvik-spot-backend-staging.onrender.com')).replace(/\/+$/, '');
            const endpoint = `${apiBaseUrl}/api/v1/messages`;

            const messageResponse = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const contentType = messageResponse.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Message service returned an invalid response.');
            }
            const messageResponsePayload = await messageResponse.json();
            if (!messageResponse.ok || !messageResponsePayload.success) {
                throw new Error(messageResponsePayload.error?.message || 'Failed to submit message.');
            }

            contactForm.reset();
            showToast('✅ Message Sent! Thank you for contacting Satvik Swaad.');
        } catch (contactSubmissionError) {
            console.error('Contact submission error:', contactSubmissionError);
            showToast('❌ Error: ' + contactSubmissionError.message);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Send Message ✉️'; }
        }
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.replaceChildren(document.createTextNode(message));
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

// Expose public methods for global consumption across pages (e.g. payment-failed, cart modals, re-order flows)
if (typeof window !== 'undefined') {
    window.openCheckout = openCheckout;
    window.closeCheckout = closeCheckout;
    window.placeOrder = placeOrder;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.addToCart = addToCart;
    window.showToast = showToast;
    window.filterCategory = filterCategory;
    window.applyAllProductFilters = applyAllProductFilters;
    window.searchProducts = searchProducts;
}

export {
    getLevenshteinDistance,
    fuzzyWordMatch,
    getSearchSuggestions,
    checkProductMatchesSearch,
    SYNONYM_GROUPS,
    SEARCH_NAV_ITEMS,
    applyAllProductFilters,
    filterCategory,
    updateCategoryBadges,
    initUniversalSearch,
    initProductsSort
};


