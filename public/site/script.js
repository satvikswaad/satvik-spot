import { sanitizeText, validateUrl, createSafeElement } from './js/security.js';
import { PRODUCTS_CATALOGUE } from './js/productsData.js';

const CART_STORAGE_KEY = 'satwikCart_v2';
const LEGACY_STORAGE_KEY = 'satwikCart';
const BACKUP_STORAGE_KEY = 'satwikCart_backup_v1';

function loadAndMigrateCart() {
    let raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to parse cart JSON:', e);
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
        } catch (mErr) {
            console.error('Legacy cart migration error:', mErr);
        }
    }

    return {};
}

let cart = loadAndMigrateCart();
let currentSlide = 0;
let autoplayTimer = null;
let touchStartX = 0;
let touchEndX = 0;
const AUTOPLAY_DELAY = 5000; // 5 seconds autoplay duration

function runInitializers() {
    ensureModalsInDOM();
    initUI();
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
    renderCart();
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
    if (formCheckout) formCheckout.addEventListener('submit', (e) => { e.preventDefault(); placeOrder(); });

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

    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const cat = tab.getAttribute('data-category');
            if (cat) filterCategory(cat);
        });
    });

    // Make product cards interactive
    initProductCardsClickHandlers();
}

function initProductCardsClickHandlers() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const pId = card.getAttribute('data-product-id');
        if (!pId) return;

        // View Details navigation
        const img = card.querySelector('.product-img');
        const title = card.querySelector('.product-title');
        const viewBtn = card.querySelector('.btn-view-details');

        const navToDetails = () => {
            window.location.href = `product-details.html?id=${encodeURIComponent(pId)}`;
        };

        if (img) { img.style.cursor = 'pointer'; img.addEventListener('click', navToDetails); }
        if (title) { title.style.cursor = 'pointer'; title.addEventListener('click', navToDetails); }
        if (viewBtn) { viewBtn.addEventListener('click', navToDetails); }

        // Add to cart from card
        const addBtn = card.querySelector('.btn-add-cart');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const prod = PRODUCTS_CATALOGUE.find(p => p.id === pId);
                const defaultVar = prod ? (prod.variants.find(v => v.active && v.stock > 0) || prod.variants[0]) : null;
                const vId = defaultVar ? defaultVar.id : 'var_500g';
                addToCart(pId, vId, 1);
            });
        }
    });
}

/* MOBILE NAVIGATION DRAWER HANDLERS */
function initMobileNav() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navOverlay = document.getElementById('mobile-nav-overlay');
    const closeBtn = document.getElementById('mobile-menu-close');

    if (!mobileBtn || !navOverlay) return;

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

    mobileBtn.addEventListener('click', openMobileMenu);
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

    sortSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const container = document.getElementById('product-grid-container');
        if (!container) return;

        const cards = Array.from(container.children);
        cards.sort((a, b) => {
            const pA = parseFloat(a.querySelector('.price-val')?.textContent.replace(/[^0-9.]/g, '') || '0');
            const pB = parseFloat(b.querySelector('.price-val')?.textContent.replace(/[^0-9.]/g, '') || '0');
            const nA = a.querySelector('.product-title')?.textContent || '';
            const nB = b.querySelector('.product-title')?.textContent || '';

            if (val === 'price-asc') return pA - pB;
            if (val === 'price-desc') return pB - pA;
            if (val === 'name-asc') return nA.localeCompare(nB);
            return 0;
        });

        cards.forEach(card => container.appendChild(card));
    });
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

        const res = await fetch(endpoint);
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return renderEmptyReviewsState(container);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data?.reviews) && data.data.reviews.length > 0) {
            renderPublicReviews(data.data.reviews, container);
        } else {
            renderEmptyReviewsState(container);
        }
    } catch (err) {
        console.warn('Reviews fetch failed, using fallback display state:', err);
        renderEmptyReviewsState(container);
    }
}

function renderPublicReviews(reviews, container) {
    const frag = document.createDocumentFragment();
    reviews.forEach(r => {
        const card = createSafeElement('div', { className: 'review-card' });
        
        const topRow = createSafeElement('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 8px;' });
        const nameSpan = createSafeElement('span', { text: r.name, style: 'font-weight: 700; color: var(--color-maroon);' });
        const starsSpan = createSafeElement('span', { text: '★'.repeat(r.rating || 5), style: 'color: #f5a623;' });
        topRow.appendChild(nameSpan);
        topRow.appendChild(starsSpan);

        const textP = createSafeElement('p', { text: r.text, style: 'color: var(--color-text); font-size: 0.95rem; line-height: 1.5;' });

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
            text: 'Your cart is empty. Explore our 15 homemade pickles & sweets!'
        });
        emptyP.style.textAlign = 'center';
        emptyP.style.color = 'var(--color-sub)';
        emptyP.style.marginTop = '40px';
        container.replaceChildren(emptyP);
        return;
    }

    const listFragment = document.createDocumentFragment();

    items.forEach(item => {
        const itemRow = createSafeElement('div', { className: 'cart-item-row' });

        const infoDiv = createSafeElement('div', { className: 'cart-item-info' });
        const nameEl = createSafeElement('span', { className: 'cart-item-name', text: `${item.name} (${item.variantLabel || 'Standard'})` });
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
                        <span style="font-size: 0.85rem; color: var(--color-sub); font-weight: 700;">🔒 256-Bit SSL Encrypted & Idempotent Secure Checkout</span>
                    </div>
                    <button type="button" id="btn-close-checkout-icon" style="background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--color-sub);">✕</button>
                </div>

                <div id="checkout-notice" style="background: #FFF3CD; color: #856404; border: 1px solid #FFEEBA; padding: 12px 16px; border-radius: 10px; font-size: 0.88rem; margin-top: 16px; font-weight: 800;">
                    ℹ️ WhatsApp-Assisted Ordering Active. Delivery charge pending confirmation.
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
                                        <span style="color: var(--color-maroon); font-weight: 700;">Pending Confirmation</span>
                                    </div>
                                    <div class="summary-total-row" style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid #DDD; padding-top: 8px; font-weight: 800; font-size: 1.1rem;">
                                        <span>Total Payable:</span>
                                        <span id="co-total-val" style="color: var(--color-maroon);">₹0</span>
                                    </div>
                                </div>

                                <div class="checkout-form-group" style="margin-top: 18px;">
                                    <div style="background: rgba(212,175,55,0.08); border: 1.5px solid var(--color-gold); border-radius: 12px; padding: 14px 16px; margin-top: 6px;">
                                        <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; color: var(--color-maroon); font-size: 0.95rem;">
                                            <span>💬</span> <span>Order through WhatsApp</span>
                                        </div>
                                        <p style="margin: 6px 0 0 0; font-size: 0.83rem; color: #555555; line-height: 1.4;">
                                            After your order request is created, WhatsApp will open. Send the prepared message to receive the official payment QR and further confirmation.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style="margin-top: 24px;">
                                <button type="submit" id="btn-submit-order" class="btn-add-cart" style="width: 100%; font-size: 1.05rem; padding: 15px; border-radius: 8px;">Continue on WhatsApp 💬</button>
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
        if (form) form.onsubmit = (e) => { e.preventDefault(); placeOrder(); };
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
        const res = await fetch(`${apiBaseUrl}/api/v1/customer/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
            container.style.display = 'block';
            select.replaceChildren();
            
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '-- Select Saved Address --';
            select.appendChild(defaultOpt);

            data.data.forEach(addr => {
                const opt = document.createElement('option');
                opt.value = addr.id;
                opt.textContent = `${addr.label}: ${addr.house}, ${addr.street}, ${addr.city} (${addr.pincode})`;
                if (addr.isDefault) {
                    opt.selected = true;
                    applyAddressToForm(addr);
                }
                select.appendChild(opt);
            });

            select.onchange = () => {
                const chosen = data.data.find(a => a.id === select.value);
                if (chosen) {
                    applyAddressToForm(chosen);
                }
            };
        } else {
            container.style.display = 'none';
        }
    } catch (err) {
        console.warn('Failed to load saved addresses:', err);
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
    const formProfile = document.getElementById('form-profile-details');
    const formAddress = document.getElementById('form-address-details');
    const displayName = document.getElementById('profile-display-name');
    const displayPhone = document.getElementById('profile-display-phone');
    const ordersContainer = document.getElementById('profile-orders-list');

    const btnSignIn = document.getElementById('btn-google-signin');
    const btnSignOut = document.getElementById('btn-google-signout');
    const authTitle = document.getElementById('auth-status-title');
    const authDesc = document.getElementById('auth-status-desc');

    let savedProfile = {};
    try {
        savedProfile = JSON.parse(localStorage.getItem('satvik_user_profile') || '{}');
    } catch (e) { savedProfile = {}; }

    function fillFormFields(data) {
        if (document.getElementById('prof-name')) document.getElementById('prof-name').value = data.name || '';
        if (document.getElementById('prof-phone')) document.getElementById('prof-phone').value = data.phone || '';
        if (document.getElementById('prof-email')) document.getElementById('prof-email').value = data.email || '';
        if (document.getElementById('prof-house')) document.getElementById('prof-house').value = data.house || '';
        if (document.getElementById('prof-street')) document.getElementById('prof-street').value = data.street || '';
        if (document.getElementById('prof-city')) document.getElementById('prof-city').value = data.city || '';
        if (document.getElementById('prof-pincode')) document.getElementById('prof-pincode').value = data.pincode || '';

        if (data.name && displayName) displayName.textContent = `Welcome, ${data.name}`;
        if (data.email && displayPhone) displayPhone.textContent = `✉️ ${data.email} | Verified Customer`;
        else if (data.phone && displayPhone) displayPhone.textContent = `📱 ${data.phone} | Default Delivery Customer`;
    }

    fillFormFields(savedProfile);

    async function syncProfileToFirestore(data) {
        const user = window.auth?.currentUser;
        if (!user || !window.db || !window.firestoreDoc || !window.firestoreSetDoc) return;
        try {
            const userRef = window.firestoreDoc(window.db, 'users', user.uid);
            const userPayload = {
                uid: user.uid,
                email: user.email || data.email || '',
                name: data.name || user.displayName || '',
                phone: data.phone || '',
                house: data.house || '',
                street: data.street || '',
                city: data.city || '',
                pincode: data.pincode || '',
                updatedAt: window.firestoreServerTimestamp ? window.firestoreServerTimestamp() : new Date().toISOString()
            };
            await window.firestoreSetDoc(userRef, userPayload, { merge: true });
            console.log('✅ Firestore user doc synced for UID:', user.uid);
        } catch (err) {
            console.warn('Firestore User Sync Warning:', err);
        }
    }

    async function loadProfileFromFirestore(user) {
        if (!user || !window.db || !window.firestoreDoc || !window.firestoreGetDoc) return;
        try {
            const userRef = window.firestoreDoc(window.db, 'users', user.uid);
            const snap = await window.firestoreGetDoc(userRef);
            if (snap.exists()) {
                const cloudData = snap.data();
                savedProfile = { ...savedProfile, ...cloudData };
                localStorage.setItem('satvik_user_profile', JSON.stringify(savedProfile));
                fillFormFields(savedProfile);
            }
        } catch (err) {
            console.warn('Failed to load profile from Firestore:', err);
        }
    }

    // Google Sign-In Handler
    if (btnSignIn) {
        btnSignIn.addEventListener('click', async () => {
            if (!window.auth || !window.GoogleAuthProvider) {
                showToast('⚠️ Google Auth service loading, please try in a moment.');
                return;
            }

            btnSignIn.disabled = true;
            btnSignIn.style.opacity = '0.6';
            const originalHTML = btnSignIn.innerHTML;
            btnSignIn.innerHTML = `<span>⏳ Signing in...</span>`;

            try {
                const provider = new window.GoogleAuthProvider();
                provider.addScope('email');
                provider.addScope('profile');
                provider.setCustomParameters({ prompt: 'select_account' });

                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                if (isMobile && window.signInWithRedirect) {
                    await window.signInWithRedirect(window.auth, provider);
                } else {
                    try {
                        const result = await window.signInWithPopup(window.auth, provider);
                        if (result && result.user) {
                            showToast(`✅ Welcome, ${result.user.displayName || result.user.email || 'Customer'}!`);
                        }
                    } catch (popupErr) {
                        console.warn('Popup login failed or blocked, falling back to redirect auth:', popupErr);
                        if (window.signInWithRedirect && popupErr.code !== 'auth/popup-closed-by-user') {
                            await window.signInWithRedirect(window.auth, provider);
                        } else if (popupErr.code === 'auth/popup-closed-by-user') {
                            console.log('User closed Google popup window.');
                        } else {
                            throw popupErr;
                        }
                    }
                }
            } catch (err) {
                console.warn('Google Sign-In Exception:', err);
                if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
                    console.log('User closed popup or cancelled auth request');
                } else {
                    showToast(`❌ Sign-in issue: ${err.message || 'Please try again'}`);
                }
            } finally {
                btnSignIn.disabled = false;
                btnSignIn.style.opacity = '1';
                btnSignIn.innerHTML = originalHTML;
            }
        });
    }

    // Sign-Out Handler
    if (btnSignOut) {
        btnSignOut.addEventListener('click', async () => {
            if (window.auth && window.signOut) {
                await window.signOut(window.auth);
                if (displayName) displayName.textContent = 'Welcome to Satvik Swaad';
                if (displayPhone) displayPhone.textContent = 'Manage your delivery details & orders';
                showToast('🚪 Signed out successfully');
            }
        });
    }

    // Auth State Listener with Retry Safeguard for Module Loading
    function setupAuthListener() {
        if (!window.auth || !window.onAuthStateChanged) {
            setTimeout(setupAuthListener, 200);
            return;
        }

        if (window.getRedirectResult) {
            window.getRedirectResult(window.auth).then((result) => {
                if (result && result.user) {
                    showToast(`✅ Welcome back, ${result.user.displayName || result.user.email}!`);
                }
            }).catch((e) => console.warn('Redirect result check:', e));
        }

        window.onAuthStateChanged(window.auth, async (user) => {
            if (user) {
                if (btnSignIn) btnSignIn.style.setProperty('display', 'none', 'important');
                if (btnSignOut) btnSignOut.style.setProperty('display', 'inline-flex', 'important');
                if (authTitle) authTitle.innerHTML = `<span>✅ Logged in as:</span> <span>${user.email || user.displayName}</span>`;
                if (authDesc) authDesc.textContent = 'Cloud Sync Active. Your delivery details, saved addresses, and order history are securely saved to your Cloud Account.';

                const userHeadingName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
                if (displayName) displayName.textContent = `Welcome, ${userHeadingName}`;
                if (displayPhone) displayPhone.textContent = `✉️ ${user.email} | Verified Google Account`;

                if (!savedProfile.name && user.displayName) savedProfile.name = user.displayName;
                if (!savedProfile.email && user.email) savedProfile.email = user.email;
                fillFormFields(savedProfile);
                localStorage.setItem('satvik_user_profile', JSON.stringify(savedProfile));

                // 1. Instantly create/upsert Firestore user document on sign in
                await syncProfileToFirestore(savedProfile);

                // 2. Restore saved profile & address data from Firestore
                await loadProfileFromFirestore(user);
            } else {
                if (btnSignIn) btnSignIn.style.setProperty('display', 'flex', 'important');
                if (btnSignOut) btnSignOut.style.setProperty('display', 'none', 'important');
                if (authTitle) authTitle.innerHTML = `<span>🔐</span> <span>Cloud Account Backup & Restore</span>`;
                if (authDesc) authDesc.textContent = 'Sign in with Google to securely store and restore your delivery details, saved addresses, and order history across devices or after clearing browser cache.';
            }
        });
    }

    setupAuthListener();

    if (formProfile) {
        formProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            savedProfile.name = document.getElementById('prof-name')?.value.trim();
            savedProfile.phone = document.getElementById('prof-phone')?.value.trim();
            savedProfile.email = document.getElementById('prof-email')?.value.trim();
            localStorage.setItem('satvik_user_profile', JSON.stringify(savedProfile));
            fillFormFields(savedProfile);
            await syncProfileToFirestore(savedProfile);
            showToast('✅ Personal Information & Cloud Sync Saved!');
        });
    }

    if (formAddress) {
        formAddress.addEventListener('submit', async (e) => {
            e.preventDefault();
            savedProfile.house = document.getElementById('prof-house')?.value.trim();
            savedProfile.street = document.getElementById('prof-street')?.value.trim();
            savedProfile.city = document.getElementById('prof-city')?.value.trim();
            savedProfile.pincode = document.getElementById('prof-pincode')?.value.trim();
            localStorage.setItem('satvik_user_profile', JSON.stringify(savedProfile));
            await syncProfileToFirestore(savedProfile);
            showToast('📍 Delivery Address & Cloud Sync Saved!');
        });
    }

    // Render Order History if present
    if (ordersContainer) {
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('satwik_orders_history') || '[]');
        } catch (e) { history = []; }

        if (history.length > 0) {
            const frag = document.createDocumentFragment();
            history.forEach(order => {
                const card = createSafeElement('div', { className: 'order-history-card' });
                card.style.cssText = 'border: 2px solid var(--color-border); border-radius: 12px; padding: 14px; margin-bottom: 12px; background: #fafafa;';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 800; color: var(--color-maroon);">Order #${order.orderId || 'STK-' + Date.now().toString().slice(-4)}</span>
                        <span style="font-size: 0.8rem; background: #e6f7ff; color: #1890ff; padding: 4px 8px; border-radius: 6px; font-weight: 700;">${order.status || 'CONFIRMED'}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--color-sub); margin-bottom: 6px;">Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Recent'}</div>
                    <div style="font-weight: 700; margin-bottom: 8px;">Total: ₹${order.totalPrice || order.total || 0}</div>
                `;
                frag.appendChild(card);
            });
            ordersContainer.replaceChildren(frag);
        }
    }
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
        const res = await fetch(`${apiBaseUrl}/api/v1/customer/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : {};
        const profile = data.data || { name: user.displayName || 'Valued Customer', phone: user.phoneNumber || '' };

        const addrRes = await fetch(`${apiBaseUrl}/api/v1/customer/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const addrContentType = addrRes.headers.get('content-type') || '';
        const addrData = addrContentType.includes('application/json') ? await addrRes.json() : {};
        const addresses = addrData.data || [];

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
                        ${addresses.map(a => `
                            <div style="background: #FFF; border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>[${a.label}] ${a.name}</strong> ${a.isDefault ? '<span style="background: #E8F5E9; color: #2E7D32; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;">Default</span>' : ''}
                                    <div style="font-size: 0.85rem; color: #555;">${a.house}, ${a.street}, ${a.city} - ${a.pincode}</div>
                                    <div style="font-size: 0.82rem; color: #777;">📞 ${a.phone}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    } catch (err) {
        console.warn('Profile fetch failed:', err);
        container.innerHTML = `<p style="color: red;">Failed to load profile details.</p>`;
    }
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

    if (items.length === 0) {
        summaryContainer.replaceChildren(createSafeElement('p', { text: 'No items in cart.', className: 'color-sub' }));
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const row = createSafeElement('div', { className: 'summary-row' });
        const nameSpan = createSafeElement('span', { text: `${item.name} (${item.variantLabel}) × ${item.qty}` });
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

function filterCategory(category) {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (category === 'all' || cat === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

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
}

function searchProducts(query) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
        const hindiTitle = card.querySelector('.product-hindi-title')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.product-desc')?.textContent.toLowerCase() || '';
        if (!q || title.includes(q) || hindiTitle.includes(q) || desc.includes(q)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
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
    document.title = `${prod.name} – Satvik Swaad`;
    const breadcrumbTitle = document.getElementById('pd-breadcrumb-title');
    if (breadcrumbTitle) breadcrumbTitle.textContent = prod.name;

    const titleEl = document.getElementById('pd-title');
    const hindiTitleEl = document.getElementById('pd-hindi-title');
    const badgeEl = document.getElementById('pd-badge');
    const shortDescEl = document.getElementById('pd-short-desc');
    const fullDescEl = document.getElementById('pd-full-desc');
    const ingredientsEl = document.getElementById('pd-ingredients');
    const storageEl = document.getElementById('pd-storage-info');
    const shelfLifeEl = document.getElementById('pd-shelf-life');
    const allergensEl = document.getElementById('pd-allergens');
    const packagingEl = document.getElementById('pd-packaging');
    const ratingValEl = document.getElementById('pd-rating-val');
    const reviewCountEl = document.getElementById('pd-review-count-text');

    if (titleEl) titleEl.textContent = prod.name;
    if (hindiTitleEl) hindiTitleEl.textContent = prod.hindiName || '';
    if (shortDescEl) shortDescEl.textContent = prod.shortDesc || '';
    if (fullDescEl) fullDescEl.textContent = prod.fullDesc || prod.shortDesc;
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

        const res = await fetch(endpoint);
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return renderEmptyReviewsState(container);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data?.reviews) && data.data.reviews.length > 0) {
            renderPublicReviews(data.data.reviews, container);
        } else {
            renderEmptyReviewsState(container);
        }
    } catch (err) {
        console.warn('Product reviews fetch failed:', err);
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
    if (btn) { btn.textContent = '⏳ Opening WhatsApp...'; btn.disabled = true; }

    try {
        const idempotencyKey = 'idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const payload = {
            name,
            phone,
            email,
            house: finalHouse || fullAddress,
            street: finalStreet || city || fullAddress,
            landmark,
            city,
            state: state || 'Uttar Pradesh',
            pincode,
            address: fullAddress,
            note,
            paymentMethod: 'WhatsApp-Assisted Ordering',
            idempotencyKey,
            items: cartItems.map(i => ({ productId: String(i.productId || i.id), variantId: String(i.variantId || 'var_500g'), qty: i.qty }))
        };

        // Instant Subtotal & Total calculation for guaranteed fast redirect
        let subtotal = 0;
        cartItems.forEach(i => { subtotal += (Number(i.price) || 0) * (Number(i.qty) || 1); });
        const shippingFee = subtotal >= 500 ? 0 : 50;
        let orderTotal = subtotal + shippingFee;

        // Build prefilled WhatsApp message & URL immediately
        let targetMessage = generateFrontendWhatsAppMessage({
            orderId: null,
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

        let targetWhatsAppUrl = `https://wa.me/919236587600?text=${encodeURIComponent(targetMessage)}`;
        let orderResultObj = {
            orderId: 'SATVIK-' + Date.now().toString(36).slice(-6).toUpperCase(),
            total: orderTotal,
            subtotal,
            shippingFee,
            whatsappUrl: targetWhatsAppUrl,
            whatsappMessage: targetMessage
        };

        // Send backend POST in parallel with 4s timeout (so cold-start Render servers won't hang browser)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        try {
            const apiBaseUrl = String(window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://satvik-spot-backend-staging.onrender.com')).replace(/\/+$/, '');
            const checkoutUrl = `${apiBaseUrl}/api/v1/orders/create-whatsapp-request`;
            const headers = { 'Content-Type': 'application/json' };

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

            const response = await fetch(checkoutUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    orderResultObj = data.data;
                    if (data.data.whatsappUrl) targetWhatsAppUrl = data.data.whatsappUrl;
                }
            }
        } catch (netErr) {
            clearTimeout(timeoutId);
            console.warn('Backend order recording notice (proceeding directly to WhatsApp):', netErr);
        }

        // Close Checkout & Reset Cart
        closeCheckout();
        cart = {};
        saveCart();
        renderCart();

        // Direct Redirection (Never blocked by pop-up blockers)
        window.location.href = targetWhatsAppUrl;

    } catch (e) {
        console.error("Order error:", e);
        if (errEl) {
            errEl.textContent = '⚠️ Order processing failed: ' + e.message;
            errEl.style.display = 'block';
        } else {
            alert('⚠️ Order processing failed: ' + e.message);
        }
    } finally {
        if (btn) { btn.textContent = 'Continue on WhatsApp 💬'; btn.disabled = false; }
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
            } catch (err) {
                console.warn('Clipboard copy failed:', err);
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

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
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

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Message service returned an invalid response.');
            }
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error?.message || 'Failed to submit message.');
            }

            contactForm.reset();
            showToast('✅ Message Sent! Thank you for contacting Satvik Swaad.');
        } catch (err) {
            console.error('Contact submission error:', err);
            showToast('❌ Error: ' + err.message);
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
