import { sanitizeText, validateUrl, createSafeElement } from './js/security.js';

let cart = JSON.parse(localStorage.getItem('satwikCart') || '{}');
let currentSlide = 0;
let autoplayTimer = null;
let touchStartX = 0;
let touchEndX = 0;
const AUTOPLAY_DELAY = 5000; // 5 seconds autoplay duration

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initHeroSlider();
    initScrollReveal();
    initScrollToTop();
    initMobileNav();
    initFaqSearch();
    initProductsSort();
    initReviewsData();
    renderCart();
});

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
    if (btnCloseCheckout) btnCloseCheckout.addEventListener('click', closeCheckout);
    if (btnCloseCheckoutIcon) btnCloseCheckoutIcon.addEventListener('click', closeCheckout);
    if (formCheckout) formCheckout.addEventListener('submit', (e) => { e.preventDefault(); placeOrder(); });

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

    const addBtns = document.querySelectorAll('.btn-add-cart');
    addBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pId = btn.getAttribute('data-product-id');
            const pName = btn.getAttribute('data-product-name');
            const pPrice = parseFloat(btn.getAttribute('data-product-price') || '0');
            if (pId && pName) addToCart(pId, pName, pPrice);
        });
    });

    updateCartCount();
}

/* MOBILE NAVIGATION DRAWER HANDLERS */
function initMobileNav() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navOverlay = document.getElementById('mobile-nav-overlay');
    const closeBtn = document.getElementById('mobile-nav-close');

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

    const links = navOverlay.querySelectorAll('a');
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

    // PAUSE ON HOVER & RESUME ON LEAVE
    sliderContainer.addEventListener('mouseenter', stopAutoplay);
    sliderContainer.addEventListener('mouseleave', startAutoplay);

    // TAB VISIBILITY HANDLER
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    });

    // MOBILE TOUCH SWIPE
    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    }, { passive: true });

    sliderContainer.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            showSlide((currentSlide - 1 + slides.length) % slides.length);
            restartAutoplay();
        }
        if (e.key === 'ArrowRight') {
            showSlide((currentSlide + 1) % slides.length);
            restartAutoplay();
        }
    });

    function handleSwipe() {
        const swipeThreshold = 40;
        if (touchEndX < touchStartX - swipeThreshold) {
            showSlide((currentSlide + 1) % slides.length);
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            showSlide((currentSlide - 1 + slides.length) % slides.length);
        }
    }

    showSlide(0);
    startAutoplay();
}

/* SCROLL REVEAL ANIMATIONS */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
}

function initScrollToTop() {
    const btnScroll = document.getElementById('btn-scroll-top');
    if (!btnScroll) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btnScroll.classList.add('visible');
        } else {
            btnScroll.classList.remove('visible');
        }
    }, { passive: true });

    btnScroll.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* PRODUCTS PAGE SORTING */
function initProductsSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
        const val = sortSelect.value;
        const grid = document.getElementById('product-grid-container');
        if (!grid) return;

        const cards = Array.from(grid.querySelectorAll('.product-card'));
        cards.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('.price-val')?.textContent.replace('₹', '') || '0');
            const priceB = parseFloat(b.querySelector('.price-val')?.textContent.replace('₹', '') || '0');
            const titleA = a.querySelector('.product-title')?.textContent.toLowerCase() || '';
            const titleB = b.querySelector('.product-title')?.textContent.toLowerCase() || '';

            if (val === 'price-asc') return priceA - priceB;
            if (val === 'price-desc') return priceB - priceA;
            if (val === 'name-asc') return titleA.localeCompare(titleB);
            return 0;
        });

        cards.forEach(c => grid.appendChild(c));
    });
}

/* FAQ SEARCH FILTER & ARIA EXPANDE D HANDLERS */
function initFaqSearch() {
    const faqSearch = document.getElementById('faq-search-input');
    const faqContainer = document.querySelector('.faq-container');
    if (!faqContainer) return;

    const detailsList = faqContainer.querySelectorAll('details');
    detailsList.forEach(d => {
        const summary = d.querySelector('summary');
        if (summary) {
            summary.setAttribute('aria-expanded', d.open ? 'true' : 'false');
            d.addEventListener('toggle', () => {
                summary.setAttribute('aria-expanded', d.open ? 'true' : 'false');
            });
        }
    });

    if (faqSearch) {
        faqSearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            detailsList.forEach(d => {
                const text = d.textContent.toLowerCase();
                if (!q || text.includes(q)) {
                    d.style.display = 'block';
                    if (q) d.open = true;
                } else {
                    d.style.display = 'none';
                }
            });
        });
    }
}

/* REVIEWS PAGE DATA LOADING & EMPTY STATE */
async function initReviewsData() {
    const container = document.getElementById('public-reviews-container');
    if (!container) return;

    try {
        const isEmulator = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const endpoint = isEmulator
            ? 'http://127.0.0.1:5001/satwiksweetsandpickels/us-central1/api/api/v1/reviews'
            : '/api/v1/reviews';

        const res = await fetch(endpoint);
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                renderApprovedReviews(container, data.data);
                return;
            }
        }
    } catch (e) {
        console.warn('Reviews API fetch warning:', e);
    }

    renderEmptyReviewsState(container);
}

function renderApprovedReviews(container, reviews) {
    const fragment = document.createDocumentFragment();
    reviews.forEach(r => {
        const card = createSafeElement('div', {
            className: 'trust-card',
            style: 'background: #FFFFFF; flex-direction: column; align-items: flex-start; gap: 10px;'
        });

        const starsDiv = createSafeElement('div', {
            text: '⭐'.repeat(r.rating || 5),
            style: 'color: var(--color-gold); font-size: 1.1rem;'
        });

        const textP = createSafeElement('p', {
            text: `"${sanitizeText(r.comment || '')}"`,
            style: 'font-size: 0.96rem; color: var(--color-sub); line-height: 1.6;'
        });

        const nameSpan = createSafeElement('span', {
            text: `— ${sanitizeText(r.name || 'Anonymous Customer')} ${r.verified ? ' (Verified Buyer)' : ''}`,
            style: 'font-size: 0.86rem; color: var(--color-green); font-weight: 900;'
        });

        card.appendChild(starsDiv);
        card.appendChild(textP);
        card.appendChild(nameSpan);
        fragment.appendChild(card);
    });

    container.replaceChildren(fragment);
}

function renderEmptyReviewsState(container) {
    const emptyBox = createSafeElement('div', {
        style: 'background: #FFFFFF; border: 2px solid var(--color-border); border-radius: var(--radius-card); padding: 48px; text-align: center; max-width: 700px; margin: 0 auto; box-shadow: var(--shadow-soft);'
    });

    const icon = createSafeElement('div', { text: '💬', style: 'font-size: 3rem; margin-bottom: 16px;' });
    const textP = createSafeElement('p', {
        text: 'No customer reviews have been published yet. Be the first to share your experience after trying Satvik Swaad.',
        style: 'font-size: 1.1rem; color: var(--color-sub); line-height: 1.7;'
    });

    emptyBox.appendChild(icon);
    emptyBox.appendChild(textP);
    container.replaceChildren(emptyBox);
}

function addToCart(id, name, price) {
    if (cart[id]) {
        cart[id].qty += 1;
    } else {
        cart[id] = { id, name, price, qty: 1 };
    }
    saveCart();
    renderCart();
    animateCartBadge();
    showToast(`Added ${name} to cart! 🛒`);
}

function removeFromCart(id) {
    if (cart[id]) {
        delete cart[id];
        saveCart();
        renderCart();
        animateCartBadge();
    }
}

function changeQty(id, delta) {
    if (cart[id]) {
        cart[id].qty += delta;
        if (cart[id].qty <= 0) {
            delete cart[id];
        }
        saveCart();
        renderCart();
        animateCartBadge();
    }
}

function saveCart() {
    localStorage.setItem('satwikCart', JSON.stringify(cart));
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-display');
    const countBadge = document.getElementById('cart-count-badge');

    if (!container) return;

    const items = Object.values(cart);
    const totalQty = items.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = items.reduce((acc, item) => acc + (item.qty * item.price), 0);

    if (countBadge) countBadge.textContent = String(totalQty);
    if (totalEl) totalEl.textContent = `₹${totalPrice}`;

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
        const nameEl = createSafeElement('span', { className: 'cart-item-name', text: item.name });
        const priceEl = createSafeElement('span', { className: 'cart-item-price', text: `₹${item.price} × ${item.qty} = ₹${item.price * item.qty}` });
        infoDiv.appendChild(nameEl);
        infoDiv.appendChild(priceEl);

        const controlsDiv = createSafeElement('div', { className: 'cart-item-controls' });

        const btnMinus = createSafeElement('button', {
            className: 'qty-btn',
            text: '-',
            events: { click: () => changeQty(item.id, -1) }
        });

        const qtySpan = createSafeElement('span', { className: 'qty-val', text: String(item.qty) });

        const btnPlus = createSafeElement('button', {
            className: 'qty-btn',
            text: '+',
            events: { click: () => changeQty(item.id, 1) }
        });

        const btnRemove = createSafeElement('button', {
            className: 'remove-btn',
            text: '🗑️',
            events: { click: () => removeFromCart(item.id) }
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
    const countBadge = document.getElementById('cart-count-badge');
    if (!countBadge) return;
    countBadge.classList.remove('bump');
    void countBadge.offsetWidth;
    countBadge.classList.add('bump');
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

function openCheckout() {
    closeCart();
    renderCheckoutSummary();
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'flex';
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
        const nameSpan = createSafeElement('span', { text: `${item.name} × ${item.qty}` });
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

export async function placeOrder() {
    const nameInput = document.getElementById('co-name');
    const phoneInput = document.getElementById('co-phone');
    const addressInput = document.getElementById('co-address');
    const paymentSelect = document.getElementById('co-payment');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const payment = paymentSelect ? paymentSelect.value : 'Cash on Delivery';

    if (!name || !phone || !address) {
        alert('Please fill in all required shipping fields.');
        return;
    }

    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const btn = document.querySelector('#checkout-form button[type="submit"]');
    if (btn) { btn.textContent = '⏳ Processing Order...'; btn.disabled = true; }

    try {
        const idempotencyKey = 'idem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const payload = {
            name,
            phone,
            address,
            paymentMethod: payment,
            idempotencyKey,
            items: cartItems.map(i => ({ productId: String(i.id), qty: i.qty }))
        };

        const isEmulator = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const endpoint = isEmulator
            ? 'http://127.0.0.1:5001/satwiksweetsandpickels/us-central1/api/api/v1/orders/create'
            : '/api/v1/orders/create';

        const headers = { 'Content-Type': 'application/json' };
        if (window.auth?.currentUser) {
            try {
                const token = await window.auth.currentUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            } catch (tErr) {
                console.warn('Could not attach Auth token:', tErr);
            }
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error?.message || 'Failed to place order');
        }

        const result = data.data;
        console.log("✅ Order created:", result.orderId);

        localStorage.setItem('lastOrderId', result.orderId);
        if (result.guestAccessSecret) {
            localStorage.setItem('lastGuestSecret_' + result.orderId, result.guestAccessSecret);
        }

        closeCheckout();
        cart = {};
        saveCart();
        renderCart();

        showToast(`✅ Order Placed! Order ID: #${result.orderId.slice(-6).toUpperCase()}`);
    } catch (e) {
        console.error("Order error:", e);
        alert('Order processing failed: ' + e.message);
    } finally {
        if (btn) { btn.textContent = 'Place Order 🎉'; btn.disabled = false; }
    }
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
