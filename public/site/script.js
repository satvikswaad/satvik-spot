import { sanitizeText, validateUrl, createSafeElement } from './js/security.js';

let cart = JSON.parse(localStorage.getItem('satwikCart') || '{}');

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    renderCart();
});

function initUI() {
    const btnOpenCart = document.getElementById('btn-open-cart');
    const btnCloseCart = document.getElementById('btn-close-cart');
    const btnCheckout = document.getElementById('btn-checkout');
    const btnCloseCheckout = document.getElementById('btn-close-checkout');
    const formCheckout = document.getElementById('checkout-form');

    if (btnOpenCart) btnOpenCart.addEventListener('click', openCart);
    if (btnCloseCart) btnCloseCart.addEventListener('click', closeCart);
    if (btnCheckout) btnCheckout.addEventListener('click', openCheckout);
    if (btnCloseCheckout) btnCloseCheckout.addEventListener('click', closeCheckout);
    if (formCheckout) formCheckout.addEventListener('submit', (e) => { e.preventDefault(); placeOrder(); });

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
}

function addToCart(id, name, price) {
    if (cart[id]) {
        cart[id].qty += 1;
    } else {
        cart[id] = { id, name, price, qty: 1 };
    }
    saveCart();
    renderCart();
    showToast(`Added ${name} to cart!`);
}

function removeFromCart(id) {
    if (cart[id]) {
        delete cart[id];
        saveCart();
        renderCart();
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
            text: 'Your cart is empty. Add some delicious pickles & sweets!'
        });
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

function openCart() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.add('active');
}

function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.remove('active');
}

function openCheckout() {
    closeCart();
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'flex';
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
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(t => {
        if (t.getAttribute('data-category') === category) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
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
    }, 3000);
}
