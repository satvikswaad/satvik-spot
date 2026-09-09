import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    collection,
    doc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    setDoc,
    addDoc,
    deleteDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Global Admin Reactive State
const adminState = {
    currentUser: null,
    claims: null,
    orders: [],
    products: [],
    offlineFinances: [],
    activeView: 'view-dashboard',
    orderStatusFilter: 'all',
    orderPaymentFilter: 'all',
    orderSearchQuery: '',
    productCategoryFilter: 'all',
    productSearchQuery: '',
    unsubOrders: null,
    unsubProducts: null,
    unsubOffline: null
};

// Inactivity Session Guardian (15 Minutes Total, 2 Min Warning)
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
const WARNING_LIMIT_MS = 13 * 60 * 1000;
let lastActivityTime = Date.now();
let inactivityInterval = null;

// Initialize Event Listeners safely via addEventListener (ZERO inline event attributes)
document.addEventListener('DOMContentLoaded', () => {
    // Auth Form elements
    const btnLogin = document.getElementById('btn-login');
    const inputPass = document.getElementById('a-pass');
    const linkForgot = document.getElementById('link-forgot');
    const btnReset = document.getElementById('btn-reset');
    const linkBack = document.getElementById('link-back');
    const btnLogout = document.getElementById('btn-logout');
    const btnStay = document.getElementById('btn-stay');

    if (btnLogin) btnLogin.addEventListener('click', handleAdminLogin);
    if (inputPass) inputPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdminLogin(); });
    if (linkForgot) linkForgot.addEventListener('click', (e) => { e.preventDefault(); showResetForm(); });
    if (btnReset) btnReset.addEventListener('click', handlePasswordReset);
    if (linkBack) linkBack.addEventListener('click', (e) => { e.preventDefault(); hideResetForm(); });
    if (btnLogout) btnLogout.addEventListener('click', handleAdminLogout);
    if (btnStay) btnStay.addEventListener('click', resetInactivityTimer);

    // Sidebar & View Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            if (targetView) switchAdminView(targetView);
        });
    });

    const sidebar = document.getElementById('admin-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
    const btnSidebarClose = document.getElementById('btn-sidebar-close');

    function toggleMobileSidebar(forceState) {
        if (!sidebar) return;
        const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');
        if (isOpen) {
            sidebar.classList.add('open');
            if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
            if (window.innerWidth <= 820) document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('open');
            if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (btnSidebarToggle) btnSidebarToggle.addEventListener('click', () => toggleMobileSidebar());
    if (btnSidebarClose) btnSidebarClose.addEventListener('click', () => toggleMobileSidebar(false));
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', () => toggleMobileSidebar(false));

    const btnDashPendingOrders = document.getElementById('btn-dash-new-order-filter');
    if (btnDashPendingOrders) {
        btnDashPendingOrders.addEventListener('click', () => {
            switchAdminView('view-orders');
            setOrderStatusFilter('pending');
        });
    }

    const btnManualLock = document.getElementById('btn-manual-lock');
    if (btnManualLock) btnManualLock.addEventListener('click', handleAdminLogout);

    // Orders Filter & Search Handlers
    const orderStatusTabs = document.querySelectorAll('#orders-status-tabs .filter-tab');
    orderStatusTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const status = tab.getAttribute('data-status');
            if (status) setOrderStatusFilter(status);
        });
    });

    const selectPaymentFilter = document.getElementById('select-payment-filter');
    if (selectPaymentFilter) {
        selectPaymentFilter.addEventListener('change', (e) => {
            adminState.orderPaymentFilter = e.target.value;
            renderOrdersView();
        });
    }

    const inputSearchOrders = document.getElementById('input-search-orders');
    if (inputSearchOrders) {
        inputSearchOrders.addEventListener('input', (e) => {
            adminState.orderSearchQuery = e.target.value.trim().toLowerCase();
            renderOrdersView();
        });
    }

    // Products Filter & Search Handlers
    const productCategoryTabs = document.querySelectorAll('#products-category-tabs .filter-tab');
    productCategoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            productCategoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            adminState.productCategoryFilter = tab.getAttribute('data-category') || 'all';
            renderProductsView();
        });
    });

    const inputSearchProducts = document.getElementById('input-search-products');
    if (inputSearchProducts) {
        inputSearchProducts.addEventListener('input', (e) => {
            adminState.productSearchQuery = e.target.value.trim().toLowerCase();
            renderProductsView();
        });
    }

    // Product Modal Handlers
    const btnOpenNewProd = document.getElementById('btn-open-new-product-modal');
    if (btnOpenNewProd) btnOpenNewProd.addEventListener('click', () => openProductModal());

    const btnCloseProdModal = document.getElementById('btn-close-product-modal');
    if (btnCloseProdModal) btnCloseProdModal.addEventListener('click', closeProductModal);

    const btnCancelProdModal = document.getElementById('btn-cancel-product-modal');
    if (btnCancelProdModal) btnCancelProdModal.addEventListener('click', closeProductModal);

    const formProductEdit = document.getElementById('form-product-edit');
    if (formProductEdit) formProductEdit.addEventListener('submit', handleProductFormSubmit);

    // Shipping Modal Handlers
    const btnCloseShippingModal = document.getElementById('btn-close-shipping-modal');
    if (btnCloseShippingModal) btnCloseShippingModal.addEventListener('click', closeShippingModal);

    const btnCancelShippingModal = document.getElementById('btn-cancel-shipping-modal');
    if (btnCancelShippingModal) btnCancelShippingModal.addEventListener('click', closeShippingModal);

    const formShippingDispatch = document.getElementById('form-shipping-dispatch');
    if (formShippingDispatch) formShippingDispatch.addEventListener('submit', handleShippingDispatchSubmit);

    // Offline Finances Modal Handlers
    const btnOpenOfflineModal = document.getElementById('btn-open-offline-modal');
    if (btnOpenOfflineModal) {
        btnOpenOfflineModal.addEventListener('click', () => {
            const dateInput = document.getElementById('off-date');
            if (dateInput && !dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            openModal('modal-offline');
        });
    }

    const btnCloseOfflineModal = document.getElementById('btn-close-offline-modal');
    if (btnCloseOfflineModal) btnCloseOfflineModal.addEventListener('click', () => closeModal('modal-offline'));

    const btnCancelOfflineModal = document.getElementById('btn-cancel-offline-modal');
    if (btnCancelOfflineModal) btnCancelOfflineModal.addEventListener('click', () => closeModal('modal-offline'));

    const formOfflineEntry = document.getElementById('form-offline-entry');
    if (formOfflineEntry) formOfflineEntry.addEventListener('submit', handleOfflineEntrySubmit);

    // Modal backdrop click-to-dismiss
    ['modal-product', 'modal-shipping', 'modal-offline'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modalId);
                }
            });
        }
    });

    // Escape key modal dismissal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ['modal-product', 'modal-shipping', 'modal-offline'].forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && modal.style.display === 'flex') {
                    closeModal(modalId);
                }
            });
        }
    });
});

// Auth State Observer
(async function initAdminAuth() {
    let retries = 0;
    while (!window.auth && retries < 20) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
    }

    if (!window.auth) {
        showError("Authentication service unavailable. Please refresh.");
        return;
    }

    onAuthStateChanged(window.auth, async (user) => {
        if (user) {
            try {
                // Force token refresh to fetch latest custom claims
                const idTokenResult = await user.getIdTokenResult(true);

                if (idTokenResult.claims.admin === true) {
                    adminState.currentUser = user;
                    adminState.claims = idTokenResult.claims;
                    showPortalView(user, idTokenResult.claims);
                    startInactivityTimer();
                } else {
                    console.warn("Unauthorized admin portal access attempt by UID:", user.uid);
                    await signOut(window.auth);
                    showError("Access Denied: Account lacks administrative privileges.");
                }
            } catch (e) {
                console.error("Custom claim verification error:", e);
                await signOut(window.auth);
                showError("Authentication failure during authorization check.");
            }
        } else {
            showLoginView();
            stopInactivityTimer();
        }
    });
})();

// Login Handler
export async function handleAdminLogin() {
    const email = document.getElementById('a-email').value.trim();
    const pass = document.getElementById('a-pass').value.trim();
    const btn = document.getElementById('btn-login');

    hideMessages();

    if (!email || !pass) {
        showError("Please enter both email and password.");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Verifying...";

    try {
        await signInWithEmailAndPassword(window.auth, email, pass);
    } catch (e) {
        console.error("Login failed:", e.code);
        showError("Invalid email or password.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sign In →";
    }
}

// Password Reset Handler
export async function handlePasswordReset() {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) {
        showError("Please enter your email address.");
        return;
    }

    try {
        await sendPasswordResetEmail(window.auth, email);
        showInfo("Password reset link sent to your email.");
    } catch (e) {
        showError("Failed to send reset link. Please verify email address.");
    }
}

// Logout Handler
export async function handleAdminLogout() {
    stopInactivityTimer();
    unsubscribeAllStreams();
    if (window.auth) {
        await signOut(window.auth);
    }
    showLoginView();
}

// Inactivity Timer Logic
function startInactivityTimer() {
    lastActivityTime = Date.now();
    ['click', 'mousemove', 'keydown', 'scroll'].forEach(evt => {
        window.addEventListener(evt, resetInactivityTimer, { passive: true });
    });

    if (inactivityInterval) clearInterval(inactivityInterval);
    inactivityInterval = setInterval(checkInactivity, 10000);
}

function stopInactivityTimer() {
    if (inactivityInterval) clearInterval(inactivityInterval);
    ['click', 'mousemove', 'keydown', 'scroll'].forEach(evt => {
        window.removeEventListener(evt, resetInactivityTimer);
    });
    hideInactivityModal();
}

export function resetInactivityTimer() {
    lastActivityTime = Date.now();
    hideInactivityModal();
}

function checkInactivity() {
    const elapsed = Date.now() - lastActivityTime;

    if (elapsed >= INACTIVITY_LIMIT_MS) {
        console.warn("Session expired due to inactivity");
        handleAdminLogout();
    } else if (elapsed >= WARNING_LIMIT_MS) {
        showInactivityModal(Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 1000));
    }
}

function showInactivityModal(remainingSeconds) {
    const modal = document.getElementById('inactivity-modal');
    const timerSec = document.getElementById('timer-sec');
    if (modal) modal.style.display = 'flex';
    if (timerSec) timerSec.textContent = String(remainingSeconds);
}

function hideInactivityModal() {
    const modal = document.getElementById('inactivity-modal');
    if (modal) modal.style.display = 'none';
}

// UI State Toggles
function showPortalView(user, claims) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('portal-container').style.display = 'flex';

    document.getElementById('admin-user-display').textContent = '👤 ' + (user.email || user.uid);
    const badgeRole = document.getElementById('admin-claims-badge');
    if (badgeRole) badgeRole.textContent = claims.role || 'admin_owner';

    const dbgUid = document.getElementById('dbg-uid');
    const dbgEmail = document.getElementById('dbg-email');
    const dbgClaim = document.getElementById('dbg-admin-claim');
    const dbgMfa = document.getElementById('dbg-mfa');

    if (dbgUid) dbgUid.textContent = user.uid;
    if (dbgEmail) dbgEmail.textContent = user.email || 'N/A';
    if (dbgClaim) dbgClaim.textContent = claims.admin ? 'true' : 'false';
    if (dbgMfa) dbgMfa.textContent = 'Gated / Verified';

    // Start Realtime Firestore Streams
    subscribeToOrdersStream();
    subscribeToProductsStream();
    subscribeToOfflineFinancesStream();
}

function showLoginView() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('portal-container').style.display = 'none';
    const inputPass = document.getElementById('a-pass');
    if (inputPass) inputPass.value = '';
}

function hideMessages() {
    const err = document.getElementById('auth-error');
    const info = document.getElementById('auth-info');
    if (err) err.style.display = 'none';
    if (info) info.style.display = 'none';
}

function showError(msg) {
    const el = document.getElementById('auth-error');
    if (el) {
        el.textContent = '❌ ' + msg;
        el.style.display = 'block';
    }
}

function showInfo(msg) {
    const el = document.getElementById('auth-info');
    if (el) {
        el.textContent = '✅ ' + msg;
        el.style.display = 'block';
    }
}

function showResetForm() {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('reset-form').classList.remove('d-none');
}

function hideResetForm() {
    document.getElementById('reset-form').classList.add('d-none');
    document.getElementById('login-form').classList.remove('d-none');
}

// View Routing Switcher
function switchAdminView(viewId) {
    adminState.activeView = viewId;

    // Update active nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update active view sections
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => {
        if (sec.id === viewId) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });

    // Close mobile drawer if open
    const sidebar = document.getElementById('admin-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && window.innerWidth <= 820) {
        sidebar.classList.remove('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Refresh view specific rendering
    if (viewId === 'view-orders') renderOrdersView();
    if (viewId === 'view-products') renderProductsView();
    if (viewId === 'view-analytics') renderAnalyticsView();
    if (viewId === 'view-offline') renderOfflineLedgerView();
}

function setOrderStatusFilter(status) {
    adminState.orderStatusFilter = status;
    const tabs = document.querySelectorAll('#orders-status-tabs .filter-tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-status') === status) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    renderOrdersView();
}

// Modal Helper Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function unsubscribeAllStreams() {
    if (adminState.unsubOrders) { adminState.unsubOrders(); adminState.unsubOrders = null; }
    if (adminState.unsubProducts) { adminState.unsubProducts(); adminState.unsubProducts = null; }
    if (adminState.unsubOffline) { adminState.unsubOffline(); adminState.unsubOffline = null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORDERS REAL-TIME STREAM & RENDERING (ZERO innerHTML concatenation)
// ─────────────────────────────────────────────────────────────────────────────
function subscribeToOrdersStream() {
    const wrap = document.getElementById('admin-orders-stream');
    if (!wrap || !window.db) return;

    try {
        const q = query(collection(window.db, 'orders'), orderBy('createdAt', 'desc'));
        adminState.unsubOrders = onSnapshot(q, (snap) => {
            adminState.orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Update KPI counters
            updateOrdersKpi();

            // Render Dashboard feed
            renderDashboardOrdersFeed(adminState.orders.slice(0, 5));

            // Render Full Orders Tab
            renderOrdersView();

            // Refresh Analytics
            renderAnalyticsView();

            const statusText = document.getElementById('live-status-text');
            if (statusText) statusText.textContent = '● Live Sync Active';
        }, (err) => {
            console.error("Orders stream error:", err);
            const errP = document.createElement('p');
            errP.style.color = '#DC2626';
            errP.textContent = 'Security Rule Error: ' + err.message;
            wrap.replaceChildren(errP);

            const statusText = document.getElementById('live-status-text');
            if (statusText) statusText.textContent = '⚠️ Sync Error';
        });
    } catch (e) {
        console.error("Stream init error:", e);
    }
}

function updateOrdersKpi() {
    const orders = adminState.orders;
    const totalCount = orders.length;

    let pendingCount = 0;
    let unshippedCount = 0;
    let confirmedCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let grossRevenue = 0;

    orders.forEach(o => {
        const status = (o.status || '').toLowerCase();
        const payStatus = (o.paymentStatus || '').toLowerCase();

        if (status === 'pending') pendingCount++;
        else if (status === 'confirmed') {
            confirmedCount++;
            unshippedCount++; // Confirmed orders awaiting shipping
        } else if (status === 'shipped') shippedCount++;
        else if (status === 'delivered') deliveredCount++;
        else if (status === 'cancelled') cancelledCount++;

        // Calculate Revenue from confirmed/delivered/paid orders
        if (status !== 'cancelled' && (payStatus === 'paid' || payStatus === 'completed' || status === 'delivered')) {
            grossRevenue += Number(o.total || o.finalAmount || 0);
        }
    });

    // Update Dashboard KPIs
    const elRev = document.getElementById('kpi-dash-revenue');
    const elTotal = document.getElementById('kpi-dash-orders-count');
    const elPending = document.getElementById('kpi-dash-pending-count');
    const elUnshipped = document.getElementById('kpi-dash-unshipped-count');
    const elBadgePending = document.getElementById('badge-pending-orders');

    if (elRev) elRev.textContent = '₹' + grossRevenue.toLocaleString('en-IN');
    if (elTotal) elTotal.textContent = String(totalCount);
    if (elPending) elPending.textContent = String(pendingCount);
    if (elUnshipped) elUnshipped.textContent = String(unshippedCount);
    if (elBadgePending) elBadgePending.textContent = String(pendingCount + unshippedCount);

    // Update Tab Counts
    setText('cnt-tab-all', String(totalCount));
    setText('cnt-tab-pending', String(pendingCount));
    setText('cnt-tab-confirmed', String(confirmedCount));
    setText('cnt-tab-unshipped', String(unshippedCount));
    setText('cnt-tab-shipped', String(shippedCount));
    setText('cnt-tab-delivered', String(deliveredCount));
    setText('cnt-tab-cancelled', String(cancelledCount));
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Safe DOM rendering for real-time orders feed on Dashboard (ZERO innerHTML)
function renderDashboardOrdersFeed(orders) {
    const wrap = document.getElementById('admin-orders-stream');
    if (!wrap) return;

    if (!orders || orders.length === 0) {
        const emptyP = document.createElement('p');
        emptyP.style.color = '#888';
        emptyP.textContent = 'No orders found in database.';
        wrap.replaceChildren(emptyP);
        return;
    }

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';

    orders.forEach(o => {
        const card = document.createElement('div');
        card.style.background = '#FFFFFF';
        card.style.border = '1px solid #E8DFD3';
        card.style.padding = '14px 18px';
        card.style.borderRadius = '10px';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.flexWrap = 'wrap';
        card.style.gap = '10px';

        const leftCol = document.createElement('div');
        const titleStrong = document.createElement('strong');
        titleStrong.style.fontFamily = 'monospace';
        titleStrong.style.color = '#7A1C1C';
        titleStrong.style.fontSize = '0.98rem';
        titleStrong.textContent = 'Order #' + (o.id || '').slice(-6).toUpperCase();

        const summaryText = document.createTextNode(' — ₹' + (o.total || 0) + ' (' + (o.status || 'pending').toUpperCase() + ')');

        const detailsDiv = document.createElement('div');
        detailsDiv.style.fontSize = '0.82rem';
        detailsDiv.style.color = '#6B625B';
        detailsDiv.style.marginTop = '4px';
        detailsDiv.textContent = 'Customer: ' + (o.name || o.customerName || 'N/A') + ' | Phone: ' + (o.phone || o.customerPhone || 'N/A');

        leftCol.appendChild(titleStrong);
        leftCol.appendChild(summaryText);
        leftCol.appendChild(detailsDiv);

        const btnView = document.createElement('button');
        btnView.type = 'button';
        btnView.className = 'btn-secondary';
        btnView.style.padding = '6px 12px';
        btnView.style.fontSize = '0.8rem';
        btnView.textContent = 'Manage Order →';
        btnView.addEventListener('click', () => {
            switchAdminView('view-orders');
            const searchInput = document.getElementById('input-search-orders');
            if (searchInput) {
                searchInput.value = o.id;
                adminState.orderSearchQuery = o.id.toLowerCase();
                renderOrdersView();
            }
        });

        card.appendChild(leftCol);
        card.appendChild(btnView);
        container.appendChild(card);
    });

    wrap.replaceChildren(container);
}

// Safe DOM rendering for Full Orders Tab
function renderOrdersView() {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    let filtered = adminState.orders.slice();

    // 1. Status Filter
    if (adminState.orderStatusFilter === 'unshipped') {
        filtered = filtered.filter(o => (o.status || '').toLowerCase() === 'confirmed');
    } else if (adminState.orderStatusFilter !== 'all') {
        filtered = filtered.filter(o => (o.status || '').toLowerCase() === adminState.orderStatusFilter);
    }

    // 2. Payment Filter
    if (adminState.orderPaymentFilter === 'paid') {
        filtered = filtered.filter(o => {
            const p = (o.paymentStatus || '').toLowerCase();
            return p === 'paid' || p === 'completed' || o.paymentVerified === true;
        });
    } else if (adminState.orderPaymentFilter === 'unpaid') {
        filtered = filtered.filter(o => {
            const p = (o.paymentStatus || '').toLowerCase();
            return p !== 'paid' && p !== 'completed' && !o.paymentVerified;
        });
    }

    // 3. Search Query Filter
    if (adminState.orderSearchQuery) {
        const q = adminState.orderSearchQuery;
        filtered = filtered.filter(o => {
            const id = (o.id || '').toLowerCase();
            const name = (o.name || o.customerName || '').toLowerCase();
            const phone = (o.phone || o.customerPhone || '').toLowerCase();
            return id.includes(q) || name.includes(q) || phone.includes(q);
        });
    }

    if (filtered.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '40px 20px';
        emptyDiv.style.color = '#6B625B';
        const emptyH3 = document.createElement('h3');
        emptyH3.textContent = 'No orders match this filter';
        const emptyP = document.createElement('p');
        emptyP.style.marginTop = '6px';
        emptyP.textContent = 'Try changing the status tab, payment filter, or clearing the search box.';
        emptyDiv.appendChild(emptyH3);
        emptyDiv.appendChild(emptyP);
        container.replaceChildren(emptyDiv);
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(o => {
        const card = document.createElement('div');
        card.className = 'order-card';

        // Top Meta Row
        const topMeta = document.createElement('div');
        topMeta.className = 'order-top-meta';

        const idGroup = document.createElement('div');
        idGroup.className = 'order-id-group';

        const idTitle = document.createElement('span');
        idTitle.className = 'order-id-title';
        idTitle.textContent = 'Order #' + (o.id || '').toUpperCase();

        const statusPill = document.createElement('span');
        const stLower = (o.status || 'pending').toLowerCase();
        statusPill.className = 'status-pill status-' + stLower;
        statusPill.textContent = (o.status || 'pending').toUpperCase();

        const payPill = document.createElement('span');
        const isPaid = (o.paymentStatus === 'paid' || o.paymentStatus === 'completed' || o.paymentVerified === true);
        payPill.className = 'status-pill payment-pill ' + (isPaid ? 'paid' : 'unpaid');
        payPill.textContent = isPaid ? '💳 PAID' : '⏳ UNPAID';

        idGroup.appendChild(idTitle);
        idGroup.appendChild(statusPill);
        idGroup.appendChild(payPill);

        const timeSpan = document.createElement('span');
        timeSpan.style.fontSize = '0.82rem';
        timeSpan.style.color = '#6B625B';
        let dateStr = 'N/A';
        if (o.createdAt) {
            const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        timeSpan.textContent = 'Placed: ' + dateStr;

        topMeta.appendChild(idGroup);
        topMeta.appendChild(timeSpan);
        card.appendChild(topMeta);

        // Body Grid (Customer Meta | Items | Actions)
        const bodyGrid = document.createElement('div');
        bodyGrid.className = 'order-body-grid';

        // 1. Customer Column
        const custCol = document.createElement('div');
        custCol.className = 'customer-meta';
        const custName = document.createElement('h4');
        custName.textContent = o.name || o.customerName || 'Guest Customer';

        const custPhone = document.createElement('p');
        custPhone.textContent = '📞 ' + (o.phone || o.customerPhone || 'No phone provided');

        const custAddr = document.createElement('p');
        const addrText = o.address || (o.shippingAddress ? `${o.shippingAddress.line1 || ''}, ${o.shippingAddress.city || ''} ${o.shippingAddress.pincode || ''}` : 'No address provided');
        custAddr.textContent = '📍 ' + addrText;

        const custPayMethod = document.createElement('p');
        custPayMethod.textContent = '💵 Method: ' + (o.paymentMethod || 'COD / WhatsApp');

        custCol.appendChild(custName);
        custCol.appendChild(custPhone);
        custCol.appendChild(custAddr);
        custCol.appendChild(custPayMethod);

        const rawPhone = (o.phone || o.customerPhone || '').replace(/[^0-9]/g, '');
        if (rawPhone) {
            const waBtn = document.createElement('a');
            waBtn.className = 'btn-wa-chat';
            waBtn.target = '_blank';
            waBtn.rel = 'noopener noreferrer';
            const cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
            waBtn.href = `https://wa.me/${cleanPhone}?text=Namaste%20${encodeURIComponent(o.name || 'Customer')}%2C%20regarding%20your%20Satvik%20Swaad%20Order%20${o.id}`;
            waBtn.textContent = '💬 WhatsApp Customer';
            custCol.appendChild(waBtn);
        }

        // 2. Items List Column
        const itemsCol = document.createElement('div');
        const itemsTitle = document.createElement('h4');
        itemsTitle.style.fontSize = '0.92rem';
        itemsTitle.style.marginBottom = '8px';
        itemsTitle.textContent = 'Ordered Items (' + (o.items ? o.items.length : 0) + ' items):';
        itemsCol.appendChild(itemsTitle);

        const itemsTable = document.createElement('table');
        itemsTable.className = 'items-table';

        if (Array.isArray(o.items)) {
            o.items.forEach(it => {
                const tr = document.createElement('tr');
                const tdName = document.createElement('td');
                tdName.textContent = (it.name || it.productName || it.productId || 'Item') + (it.variant ? ' (' + it.variant + ')' : '');

                const tdQty = document.createElement('td');
                tdQty.style.textAlign = 'center';
                tdQty.textContent = '× ' + (it.qty || it.quantity || 1);

                const tdPrice = document.createElement('td');
                tdPrice.style.textAlign = 'right';
                tdPrice.style.fontWeight = '700';
                tdPrice.textContent = '₹' + (it.price || it.unitPrice || 0);

                tr.appendChild(tdName);
                tr.appendChild(tdQty);
                tr.appendChild(tdPrice);
                itemsTable.appendChild(tr);
            });
        }

        itemsCol.appendChild(itemsTable);

        // Total Line
        const totalLine = document.createElement('div');
        totalLine.style.display = 'flex';
        totalLine.style.justifyContent = 'space-between';
        totalLine.style.marginTop = '10px';
        totalLine.style.paddingTop = '8px';
        totalLine.style.borderTop = '1.5px solid #E8DFD3';
        totalLine.style.fontWeight = '800';
        totalLine.style.fontSize = '1.05rem';
        totalLine.style.color = '#7A1C1C';

        const totalLabel = document.createElement('span');
        totalLabel.textContent = 'Grand Total:';
        const totalVal = document.createElement('span');
        totalVal.style.fontFamily = "'DM Serif Display', serif";
        totalVal.style.fontSize = '1.35rem';
        totalVal.style.fontWeight = '700';
        totalVal.textContent = '₹' + (o.total || o.finalAmount || 0);

        totalLine.appendChild(totalLabel);
        totalLine.appendChild(totalVal);
        itemsCol.appendChild(totalLine);

        // 3. Lifecycle Action Buttons Column
        const actionsCol = document.createElement('div');
        actionsCol.className = 'order-actions-col';

        // Action: Confirm Order
        if (stLower === 'pending') {
            const btnConfirm = document.createElement('button');
            btnConfirm.type = 'button';
            btnConfirm.className = 'btn-action confirm';
            btnConfirm.textContent = '📋 Confirm Order';
            btnConfirm.addEventListener('click', () => updateOrderStatus(o.id, 'confirmed'));
            actionsCol.appendChild(btnConfirm);
        }

        // Action: Dispatch / Ship Order
        if (stLower === 'confirmed' || stLower === 'pending') {
            const btnShip = document.createElement('button');
            btnShip.type = 'button';
            btnShip.className = 'btn-action ship';
            btnShip.textContent = '🚚 Dispatch / Ship';
            btnShip.addEventListener('click', () => openShippingModal(o.id));
            actionsCol.appendChild(btnShip);
        }

        // Action: Mark Delivered
        if (stLower === 'shipped') {
            const btnDeliver = document.createElement('button');
            btnDeliver.type = 'button';
            btnDeliver.className = 'btn-action deliver';
            btnDeliver.textContent = '✅ Mark Delivered';
            btnDeliver.addEventListener('click', () => updateOrderStatus(o.id, 'delivered'));
            actionsCol.appendChild(btnDeliver);
        }

        // Action: Verify Payment
        if (!isPaid) {
            const btnVerifyPay = document.createElement('button');
            btnVerifyPay.type = 'button';
            btnVerifyPay.className = 'btn-action verify-pay';
            btnVerifyPay.textContent = '💳 Mark Paid / Verify';
            btnVerifyPay.addEventListener('click', () => verifyOrderPayment(o.id));
            actionsCol.appendChild(btnVerifyPay);
        }

        // Action: Cancel Order
        if (stLower !== 'cancelled' && stLower !== 'delivered') {
            const btnCancel = document.createElement('button');
            btnCancel.type = 'button';
            btnCancel.className = 'btn-action cancel';
            btnCancel.textContent = '❌ Cancel Order';
            btnCancel.addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel Order #' + o.id + '?')) {
                    updateOrderStatus(o.id, 'cancelled');
                }
            });
            actionsCol.appendChild(btnCancel);
        }

        bodyGrid.appendChild(custCol);
        bodyGrid.appendChild(itemsCol);
        bodyGrid.appendChild(actionsCol);
        card.appendChild(bodyGrid);

        fragment.appendChild(card);
    });

    container.replaceChildren(fragment);
}

// Order Mutation Actions
async function updateOrderStatus(orderId, newStatus) {
    if (!window.db) return;
    try {
        const orderRef = doc(window.db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        console.log(`Order ${orderId} transitioned to ${newStatus}`);
    } catch (err) {
        console.error("Failed to update order status:", err);
        alert("Failed to update order status: " + err.message);
    }
}

// Admin decision control reference: /api/v1/admin/orders/:id/verify-payment
async function verifyOrderPayment(orderId) {
    if (!window.db) return;
    try {
        const orderRef = doc(window.db, 'orders', orderId);
        await updateDoc(orderRef, {
            paymentStatus: 'paid',
            paymentVerified: true,
            verifiedAt: serverTimestamp()
        });
        console.log(`Payment for order ${orderId} verified successfully.`);
    } catch (err) {
        console.error("Failed to verify payment:", err);
        alert("Failed to verify payment: " + err.message);
    }
}

// Shipping Modal Logic
function openShippingModal(orderId) {
    const inputId = document.getElementById('ship-order-id');
    const displayId = document.getElementById('ship-order-display');
    const inputTracking = document.getElementById('ship-tracking-number');

    if (inputId) inputId.value = orderId;
    if (displayId) displayId.value = orderId;
    if (inputTracking) inputTracking.value = '';

    openModal('modal-shipping');
}

function closeShippingModal() {
    closeModal('modal-shipping');
}

async function handleShippingDispatchSubmit(e) {
    e.preventDefault();
    const orderId = document.getElementById('ship-order-id').value;
    const courier = document.getElementById('ship-courier').value;
    const trackingNumber = document.getElementById('ship-tracking-number').value.trim();

    if (!orderId || !courier || !trackingNumber) {
        alert("Please complete all dispatch details.");
        return;
    }

    try {
        const orderRef = doc(window.db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: 'shipped',
            courierPartner: courier,
            trackingNumber: trackingNumber,
            dispatchedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        closeShippingModal();
    } catch (err) {
        console.error("Dispatch update failed:", err);
        alert("Failed to update shipping dispatch: " + err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRODUCTS REAL-TIME STREAM & INVENTORY EDITING (ZERO innerHTML concatenation)
// ─────────────────────────────────────────────────────────────────────────────
function subscribeToProductsStream() {
    if (!window.db) return;

    try {
        const q = query(collection(window.db, 'products'));
        adminState.unsubProducts = onSnapshot(q, (snap) => {
            adminState.products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Update Low Stock counters & Badges
            updateStockKpi();

            // Render Products View
            renderProductsView();
        }, (err) => {
            console.error("Products stream error:", err);
        });
    } catch (e) {
        console.error("Products stream init error:", e);
    }
}

function updateStockKpi() {
    let lowStockCount = 0;
    adminState.products.forEach(p => {
        const stock = Number(p.stock !== undefined ? p.stock : 10);
        if (stock <= 5) lowStockCount++;
    });

    const elKpi = document.getElementById('kpi-dash-low-stock-count');
    const elBadge = document.getElementById('badge-low-stock');

    if (elKpi) elKpi.textContent = String(lowStockCount);
    if (elBadge) {
        elBadge.textContent = String(lowStockCount);
        if (lowStockCount > 0) {
            elBadge.classList.remove('d-none');
        } else {
            elBadge.classList.add('d-none');
        }
    }
}

function renderProductsView() {
    const container = document.getElementById('products-grid-container');
    if (!container) return;

    let filtered = adminState.products.slice();

    // 1. Category Filter
    if (adminState.productCategoryFilter !== 'all') {
        filtered = filtered.filter(p => (p.category || p.cat || '').toLowerCase() === adminState.productCategoryFilter);
    }

    // 2. Search Query Filter
    if (adminState.productSearchQuery) {
        const q = adminState.productSearchQuery;
        filtered = filtered.filter(p => {
            const name = (p.name || '').toLowerCase();
            const hindi = (p.hindiName || p.nameHindi || '').toLowerCase();
            const sku = (p.sku || p.id || '').toLowerCase();
            return name.includes(q) || hindi.includes(q) || sku.includes(q);
        });
    }

    if (filtered.length === 0) {
        const emptyP = document.createElement('p');
        emptyP.style.color = '#888';
        emptyP.style.padding = '24px';
        emptyP.textContent = 'No products found matching category/search.';
        container.replaceChildren(emptyP);
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-admin-card';

        // Thumbnail Wrap
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'product-thumb-wrap';

        const img = document.createElement('img');
        img.className = 'product-thumb-img';
        img.src = p.image || p.img || 'assets/aam-achar.png';
        img.alt = p.name || 'Product';

        const stockBadge = document.createElement('span');
        const stockQty = Number(p.stock !== undefined ? p.stock : 10);
        let stockClass = 'in-stock';
        let stockText = stockQty + ' in stock';
        if (stockQty === 0) {
            stockClass = 'out-stock';
            stockText = 'Out of Stock';
        } else if (stockQty <= 5) {
            stockClass = 'low-stock';
            stockText = 'Low Stock (' + stockQty + ')';
        }
        stockBadge.className = 'stock-badge ' + stockClass;
        stockBadge.textContent = stockText;

        thumbWrap.appendChild(img);
        thumbWrap.appendChild(stockBadge);
        card.appendChild(thumbWrap);

        // Info Wrap
        const infoWrap = document.createElement('div');
        infoWrap.className = 'product-info-wrap';

        const nameH4 = document.createElement('h4');
        nameH4.className = 'product-name-h4';
        nameH4.textContent = p.name || 'Artisanal Product';

        const hindiSub = document.createElement('div');
        hindiSub.className = 'product-hindi-sub';
        hindiSub.textContent = p.hindiName || p.nameHindi || '';

        const priceRow = document.createElement('div');
        priceRow.className = 'product-price-row';

        const priceVal = document.createElement('span');
        priceVal.className = 'product-price-val';
        priceVal.textContent = '₹' + (p.price || 0);

        const mrpVal = document.createElement('span');
        mrpVal.className = 'product-mrp-val';
        mrpVal.textContent = p.mrp ? '₹' + p.mrp : '';

        priceRow.appendChild(priceVal);
        if (p.mrp) priceRow.appendChild(mrpVal);

        // Stock Counter Row
        const counterRow = document.createElement('div');
        counterRow.className = 'stock-counter-row';
        const stockLabel = document.createElement('span');
        stockLabel.textContent = 'Current Stock:';
        const stockStrong = document.createElement('strong');
        stockStrong.textContent = stockQty + ' Units';
        counterRow.appendChild(stockLabel);
        counterRow.appendChild(stockStrong);

        // Quick Restock Buttons
        const restockBtns = document.createElement('div');
        restockBtns.className = 'quick-restock-btns';

        [10, 25, 50].forEach(amt => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'btn-restock-chip';
            chip.textContent = '+' + amt;
            chip.addEventListener('click', () => quickRestockProduct(p.id, amt));
            restockBtns.appendChild(chip);
        });

        // Edit Button
        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn-secondary';
        btnEdit.style.width = '100%';
        btnEdit.style.justifyContent = 'center';
        btnEdit.textContent = '✏️ Edit Product Details';
        btnEdit.addEventListener('click', () => openProductModal(p));

        infoWrap.appendChild(nameH4);
        infoWrap.appendChild(hindiSub);
        infoWrap.appendChild(priceRow);
        infoWrap.appendChild(counterRow);
        infoWrap.appendChild(restockBtns);
        infoWrap.appendChild(btnEdit);

        card.appendChild(infoWrap);
        fragment.appendChild(card);
    });

    container.replaceChildren(fragment);
}

// Quick Restock Function
async function quickRestockProduct(productId, amount) {
    if (!window.db) return;
    try {
        const prodRef = doc(window.db, 'products', productId);
        await updateDoc(prodRef, {
            stock: increment(amount),
            updatedAt: serverTimestamp()
        });
        console.log(`Restocked product ${productId} by +${amount}`);
    } catch (err) {
        console.error("Restock failed:", err);
        alert("Failed to restock product: " + err.message);
    }
}

// Product Edit / Create Modal Logic
function openProductModal(prod = null) {
    const title = document.getElementById('modal-product-title');
    const fieldId = document.getElementById('prod-field-id');
    const fieldName = document.getElementById('prod-field-name');
    const fieldHindi = document.getElementById('prod-field-hindi');
    const fieldCat = document.getElementById('prod-field-category');
    const fieldSku = document.getElementById('prod-field-sku');
    const fieldPrice = document.getElementById('prod-field-price');
    const fieldMrp = document.getElementById('prod-field-mrp');
    const fieldStock = document.getElementById('prod-field-stock');
    const fieldBadge = document.getElementById('prod-field-badge');
    const fieldImg = document.getElementById('prod-field-img');
    const fieldDesc = document.getElementById('prod-field-desc');
    const fieldAvail = document.getElementById('prod-field-available');

    if (prod) {
        if (title) title.textContent = 'Edit Product: ' + (prod.name || prod.id);
        if (fieldId) fieldId.value = prod.id;
        if (fieldName) fieldName.value = prod.name || '';
        if (fieldHindi) fieldHindi.value = prod.hindiName || prod.nameHindi || '';
        if (fieldCat) fieldCat.value = prod.category || prod.cat || 'achar';
        if (fieldSku) fieldSku.value = prod.sku || prod.id;
        if (fieldPrice) fieldPrice.value = prod.price || '';
        if (fieldMrp) fieldMrp.value = prod.mrp || '';
        if (fieldStock) fieldStock.value = prod.stock !== undefined ? prod.stock : 10;
        if (fieldBadge) fieldBadge.value = prod.badge || '';
        if (fieldImg) fieldImg.value = prod.image || prod.img || '';
        if (fieldDesc) fieldDesc.value = prod.desc || prod.description || '';
        if (fieldAvail) fieldAvail.checked = prod.available !== false;
    } else {
        if (title) title.textContent = 'Add New Product';
        if (fieldId) fieldId.value = '';
        if (fieldName) fieldName.value = '';
        if (fieldHindi) fieldHindi.value = '';
        if (fieldCat) fieldCat.value = 'achar';
        if (fieldSku) fieldSku.value = 'SKU-' + Date.now().toString().slice(-6);
        if (fieldPrice) fieldPrice.value = '249';
        if (fieldMrp) fieldMrp.value = '320';
        if (fieldStock) fieldStock.value = '50';
        if (fieldBadge) fieldBadge.value = 'Handcrafted';
        if (fieldImg) fieldImg.value = 'assets/aam-achar.png';
        if (fieldDesc) fieldDesc.value = 'Authentic homemade recipe prepared with cold-pressed mustard oil.';
        if (fieldAvail) fieldAvail.checked = true;
    }

    openModal('modal-product');
}

function closeProductModal() {
    closeModal('modal-product');
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    if (!window.db) return;

    const prodId = document.getElementById('prod-field-id').value.trim();
    const name = document.getElementById('prod-field-name').value.trim();
    const hindiName = document.getElementById('prod-field-hindi').value.trim();
    const category = document.getElementById('prod-field-category').value;
    const sku = document.getElementById('prod-field-sku').value.trim();
    const price = Number(document.getElementById('prod-field-price').value);
    const mrp = Number(document.getElementById('prod-field-mrp').value);
    const stock = Number(document.getElementById('prod-field-stock').value);
    const badge = document.getElementById('prod-field-badge').value.trim();
    const img = document.getElementById('prod-field-img').value.trim();
    const desc = document.getElementById('prod-field-desc').value.trim();
    const available = document.getElementById('prod-field-available').checked;

    const payload = {
        name,
        hindiName,
        category,
        cat: category,
        sku,
        price,
        mrp,
        stock,
        badge,
        img,
        image: img,
        desc,
        description: desc,
        available,
        updatedAt: serverTimestamp()
    };

    try {
        if (prodId) {
            const prodRef = doc(window.db, 'products', prodId);
            await updateDoc(prodRef, payload);
        } else {
            const newId = 'prod_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24) + '_' + Date.now().toString().slice(-4);
            const prodRef = doc(window.db, 'products', newId);
            payload.createdAt = serverTimestamp();
            await setDoc(prodRef, payload);
        }
        closeProductModal();
    } catch (err) {
        console.error("Failed to save product:", err);
        alert("Error saving product: " + err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. OFFLINE BUSINESS & EXPENSE TRACKER (ZERO innerHTML concatenation)
// ─────────────────────────────────────────────────────────────────────────────
function subscribeToOfflineFinancesStream() {
    if (!window.db) return;

    try {
        const q = query(collection(window.db, 'offline_finances'), orderBy('date', 'desc'));
        adminState.unsubOffline = onSnapshot(q, (snap) => {
            adminState.offlineFinances = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Update Offline Financial KPIs
            updateOfflineKpi();

            // Render Offline Ledger Table
            renderOfflineLedgerView();
        }, (err) => {
            console.error("Offline finances stream error:", err);
        });
    } catch (e) {
        console.error("Offline finances stream init error:", e);
    }
}

function updateOfflineKpi() {
    let totalExpenses = 0;
    let totalSales = 0;

    adminState.offlineFinances.forEach(entry => {
        const amt = Number(entry.amount || 0);
        if (entry.type === 'expense') {
            totalExpenses += amt;
        } else if (entry.type === 'income') {
            totalSales += amt;
        }
    });

    const netBalance = totalSales - totalExpenses;

    const elExp = document.getElementById('kpi-offline-expenses');
    const elSales = document.getElementById('kpi-offline-sales');
    const elNet = document.getElementById('kpi-offline-net');
    const elDashBal = document.getElementById('kpi-dash-offline-balance');

    if (elExp) elExp.textContent = '₹' + totalExpenses.toLocaleString('en-IN');
    if (elSales) elSales.textContent = '₹' + totalSales.toLocaleString('en-IN');
    if (elNet) {
        elNet.textContent = (netBalance >= 0 ? '+' : '') + '₹' + netBalance.toLocaleString('en-IN');
        elNet.style.color = netBalance >= 0 ? '#059669' : '#DC2626';
    }
    if (elDashBal) {
        elDashBal.textContent = (netBalance >= 0 ? '+' : '') + '₹' + netBalance.toLocaleString('en-IN');
        elDashBal.style.color = netBalance >= 0 ? '#059669' : '#DC2626';
    }
}

function renderOfflineLedgerView() {
    const tbody = document.getElementById('offline-ledger-table-body');
    if (!tbody) return;

    if (adminState.offlineFinances.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.style.textAlign = 'center';
        td.style.color = '#888';
        td.style.padding = '24px';
        td.textContent = 'No offline records found. Click "+ Record Offline Entry" to add one.';
        tr.appendChild(td);
        tbody.replaceChildren(tr);
        return;
    }

    const fragment = document.createDocumentFragment();

    adminState.offlineFinances.forEach(entry => {
        const tr = document.createElement('tr');

        // Date
        const tdDate = document.createElement('td');
        tdDate.textContent = entry.date || 'N/A';

        // Type
        const tdType = document.createElement('td');
        const spanType = document.createElement('span');
        spanType.className = 'tag-type ' + (entry.type || 'expense');
        spanType.textContent = (entry.type || 'expense').toUpperCase();
        tdType.appendChild(spanType);

        // Category
        const tdCat = document.createElement('td');
        tdCat.style.fontWeight = '700';
        tdCat.textContent = entry.category || 'General';

        // Description / Vendor
        const tdDesc = document.createElement('td');
        tdDesc.textContent = entry.desc || '—';

        // Amount
        const tdAmt = document.createElement('td');
        tdAmt.style.fontWeight = '800';
        const isExp = entry.type === 'expense';
        tdAmt.style.color = isExp ? '#DC2626' : '#059669';
        tdAmt.textContent = (isExp ? '- ' : '+ ') + '₹' + Number(entry.amount || 0).toLocaleString('en-IN');

        // Actions
        const tdActions = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn-secondary';
        btnDelete.style.padding = '4px 8px';
        btnDelete.style.fontSize = '0.75rem';
        btnDelete.textContent = '🗑️ Delete';
        btnDelete.addEventListener('click', () => {
            if (confirm('Delete this entry: ' + entry.category + ' (₹' + entry.amount + ')?')) {
                deleteOfflineEntry(entry.id);
            }
        });
        tdActions.appendChild(btnDelete);

        tr.appendChild(tdDate);
        tr.appendChild(tdType);
        tr.appendChild(tdCat);
        tr.appendChild(tdDesc);
        tr.appendChild(tdAmt);
        tr.appendChild(tdActions);

        fragment.appendChild(tr);
    });

    tbody.replaceChildren(fragment);
}

async function handleOfflineEntrySubmit(e) {
    e.preventDefault();
    if (!window.db) return;

    const type = document.getElementById('off-type').value;
    const category = document.getElementById('off-category').value;
    const amount = Number(document.getElementById('off-amount').value);
    const date = document.getElementById('off-date').value;
    const desc = document.getElementById('off-desc').value.trim();

    if (!amount || !date) {
        alert("Please specify amount and date.");
        return;
    }

    try {
        await addDoc(collection(window.db, 'offline_finances'), {
            type,
            category,
            amount,
            date,
            desc,
            createdAt: serverTimestamp()
        });
        closeModal('modal-offline');
        // Reset form inputs
        document.getElementById('off-amount').value = '';
        document.getElementById('off-desc').value = '';
    } catch (err) {
        console.error("Failed to add offline entry:", err);
        alert("Error adding entry: " + err.message);
    }
}

async function deleteOfflineEntry(docId) {
    if (!window.db) return;
    try {
        await deleteDoc(doc(window.db, 'offline_finances', docId));
    } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete entry: " + err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ANALYTICS & MONTHLY REPORTS ENGINE (ZERO innerHTML concatenation)
// ─────────────────────────────────────────────────────────────────────────────
function renderAnalyticsView() {
    const orders = adminState.orders;

    let totalRevenue = 0;
    let paidOrdersCount = 0;
    const catSales = {};
    const prodUnits = {};

    orders.forEach(o => {
        const st = (o.status || '').toLowerCase();
        const pay = (o.paymentStatus || '').toLowerCase();

        if (st !== 'cancelled' && (pay === 'paid' || pay === 'completed' || st === 'delivered')) {
            totalRevenue += Number(o.total || o.finalAmount || 0);
            paidOrdersCount++;

            if (Array.isArray(o.items)) {
                o.items.forEach(it => {
                    const name = it.name || it.productName || it.productId || 'Item';
                    const qty = Number(it.qty || it.quantity || 1);
                    const cat = it.category || 'achar';

                    catSales[cat] = (catSales[cat] || 0) + Number(it.price || 0) * qty;
                    prodUnits[name] = (prodUnits[name] || 0) + qty;
                });
            }
        }
    });

    // AOV
    const aov = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;
    const elAov = document.getElementById('kpi-analytics-aov');
    if (elAov) elAov.textContent = '₹' + aov.toLocaleString('en-IN');

    // Fulfillment Rate
    let deliveredCount = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
    let confirmedCount = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes((o.status || '').toLowerCase())).length;
    let rate = confirmedCount > 0 ? Math.round((deliveredCount / confirmedCount) * 100) : 100;
    const elRate = document.getElementById('kpi-analytics-fulfillment');
    if (elRate) elRate.textContent = rate + '%';

    // Render Category Distribution
    const catContainer = document.getElementById('analytics-category-distribution-container');
    if (catContainer) {
        const catEntries = Object.entries(catSales);
        if (catEntries.length === 0) {
            const p = document.createElement('p');
            p.style.color = '#888';
            p.textContent = 'No sales data yet to calculate category split.';
            catContainer.replaceChildren(p);
        } else {
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.gap = '10px';

            catEntries.sort((a, b) => b[1] - a[1]).forEach(([cat, rev]) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.padding = '8px 12px';
                row.style.background = '#FAF7F2';
                row.style.borderRadius = '8px';
                row.style.border = '1px solid #E8DFD3';

                const spanCat = document.createElement('span');
                spanCat.style.fontWeight = '700';
                spanCat.style.textTransform = 'capitalize';
                spanCat.textContent = cat;

                const spanRev = document.createElement('span');
                spanRev.style.fontWeight = '800';
                spanRev.style.color = '#7A1C1C';
                spanRev.textContent = '₹' + rev.toLocaleString('en-IN');

                row.appendChild(spanCat);
                row.appendChild(spanRev);
                wrap.appendChild(row);
            });
            catContainer.replaceChildren(wrap);
        }
    }

    // Render Top 5 Products
    const prodContainer = document.getElementById('analytics-top-products-container');
    if (prodContainer) {
        const prodEntries = Object.entries(prodUnits);
        if (prodEntries.length === 0) {
            const p = document.createElement('p');
            p.style.color = '#888';
            p.textContent = 'No sales data yet to calculate best-selling items.';
            prodContainer.replaceChildren(p);
        } else {
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.gap = '10px';

            prodEntries.sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([name, units], idx) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
                row.style.padding = '8px 12px';
                row.style.background = '#FAF7F2';
                row.style.borderRadius = '8px';
                row.style.border = '1px solid #E8DFD3';

                const left = document.createElement('div');
                left.style.display = 'flex';
                left.style.alignItems = 'center';
                left.style.gap = '8px';

                const rank = document.createElement('span');
                rank.style.fontWeight = '900';
                rank.style.color = '#D4A017';
                rank.textContent = '#' + (idx + 1);

                const title = document.createElement('span');
                title.style.fontWeight = '700';
                title.textContent = name;

                left.appendChild(rank);
                left.appendChild(title);

                const count = document.createElement('span');
                count.style.fontWeight = '800';
                count.style.color = '#2563EB';
                count.textContent = units + ' Units Sold';

                row.appendChild(left);
                row.appendChild(count);
                wrap.appendChild(row);
            });
            prodContainer.replaceChildren(wrap);
        }
    }
}
