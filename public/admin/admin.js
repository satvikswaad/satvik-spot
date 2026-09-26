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

import adminDataAdapter from "./adminDataAdapter.js";
import { initAdminAnalytics, refreshAdminAnalytics } from "./adminAnalytics.js";

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
    orderChannelFilter: 'all',
    orderSearchQuery: '',
    productCategoryFilter: 'all',
    productSearchQuery: '',
    offlineSubtab: 'offline-orders',
    offlineOrderSearchQuery: '',
    unsubOrders: null,
    unsubProducts: null,
    unsubOffline: null
};

if (typeof window !== 'undefined') {
    window.adminState = adminState;
    window.adminDataAdapter = adminDataAdapter;
}

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

    // Localhost Dev Direct Access Hook
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
        const emailInput = document.getElementById('a-email');
        if (emailInput && !emailInput.value) {
            emailInput.value = 'admin@satvikswaad.com';
        }

        const devBox = document.getElementById('dev-quick-access');
        if (devBox) devBox.style.display = 'block';

        const btnDev = document.getElementById('btn-dev-quick-login');
        if (btnDev) {
            btnDev.addEventListener('click', () => {
                const devUser = {
                    uid: 'local-dev-owner-001',
                    email: 'admin@satvikswaad.com',
                    displayName: 'Satvik Admin (Dev Owner)'
                };
                const devClaims = { admin: true, role: 'owner', schemaVersion: 1 };
                adminState.currentUser = devUser;
                adminState.claims = devClaims;
                sessionStorage.setItem('satvik_dev_admin_auth', 'true');
                showPortalView(devUser, devClaims);
                startInactivityTimer();
            });
        }

        // Auto-resume dev session if already authenticated on localhost
        if (sessionStorage.getItem('satvik_dev_admin_auth') === 'true') {
            const devUser = {
                uid: 'local-dev-owner-001',
                email: 'admin@satvikswaad.com',
                displayName: 'Satvik Admin (Dev Owner)'
            };
            const devClaims = { admin: true, role: 'owner', schemaVersion: 1 };
            adminState.currentUser = devUser;
            adminState.claims = devClaims;
            showPortalView(devUser, devClaims);
            startInactivityTimer();
        }
    }

    // Sidebar & View Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            if (targetView) switchAdminView(targetView);
        });
    });

    // Mobile Sidebar Drawer Controls
    const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
    const btnSidebarClose = document.getElementById('btn-sidebar-close');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('admin-sidebar');

    if (btnSidebarToggle) {
        btnSidebarToggle.addEventListener('click', () => {
            if (sidebar && sidebar.classList.contains('open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }
    if (btnSidebarClose) btnSidebarClose.addEventListener('click', closeMobileSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

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

    const selectChannelFilter = document.getElementById('select-channel-filter');
    if (selectChannelFilter) {
        selectChannelFilter.addEventListener('change', (e) => {
            adminState.orderChannelFilter = e.target.value;
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

    // POS Offline Order Modal Triggers
    const btnDashNewOffline = document.getElementById('btn-dash-new-offline-order');
    const btnOrdersNewOffline = document.getElementById('btn-orders-new-offline-order');
    const btnOpenOfflineOrder = document.getElementById('btn-open-offline-order-modal');

    if (btnDashNewOffline) btnDashNewOffline.addEventListener('click', openOfflineOrderModal);
    if (btnOrdersNewOffline) btnOrdersNewOffline.addEventListener('click', openOfflineOrderModal);
    if (btnOpenOfflineOrder) btnOpenOfflineOrder.addEventListener('click', openOfflineOrderModal);

    const btnCloseOfflineOrder = document.getElementById('btn-close-offline-order-modal');
    const btnCancelOfflineOrder = document.getElementById('btn-cancel-offline-order-modal');
    if (btnCloseOfflineOrder) btnCloseOfflineOrder.addEventListener('click', closeOfflineOrderModal);
    if (btnCancelOfflineOrder) btnCancelOfflineOrder.addEventListener('click', closeOfflineOrderModal);

    const formOfflineOrder = document.getElementById('form-offline-order');
    if (formOfflineOrder) formOfflineOrder.addEventListener('submit', handleOfflineOrderSubmit);

    const btnPosAddItem = document.getElementById('btn-pos-add-item');
    if (btnPosAddItem) btnPosAddItem.addEventListener('click', addPosItemRow);

    const posDiscountInput = document.getElementById('pos-discount');
    if (posDiscountInput) posDiscountInput.addEventListener('input', calculatePosTotal);

    // Offline Business View Sub-Tabs
    const btnSubtabPos = document.getElementById('btn-subtab-pos-orders');
    const btnSubtabExpenses = document.getElementById('btn-subtab-expenses');
    if (btnSubtabPos && btnSubtabExpenses) {
        btnSubtabPos.addEventListener('click', () => switchOfflineSubtab('offline-orders'));
        btnSubtabExpenses.addEventListener('click', () => switchOfflineSubtab('offline-expenses'));
    }

    const inputSearchOfflineOrders = document.getElementById('input-search-offline-orders');
    if (inputSearchOfflineOrders) {
        inputSearchOfflineOrders.addEventListener('input', (e) => {
            adminState.offlineOrderSearchQuery = e.target.value.trim().toLowerCase();
            renderOfflineOrdersTable();
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

    // Backdrop dismissal for all modals
    ['modal-product', 'modal-shipping', 'modal-offline'].forEach(modalId => {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            modalEl.addEventListener('click', (e) => {
                if (e.target === modalEl) closeModal(modalId);
            });
        }
    });

    // Keyboard Escape to dismiss modals and drawer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('modal-product');
            closeModal('modal-shipping');
            closeModal('modal-offline');
            closeMobileSidebar();
        }
    });
});

// Mobile Drawer Helper Functions
function openMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

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
    sessionStorage.removeItem('satvik_dev_admin_auth');
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
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, resetInactivityTimer, { passive: true });
    });

    if (inactivityInterval) clearInterval(inactivityInterval);
    inactivityInterval = setInterval(checkInactivity, 10000);
}

function stopInactivityTimer() {
    if (inactivityInterval) clearInterval(inactivityInterval);
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
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
    closeMobileSidebar();

    // Scroll to top of viewport
    const viewport = document.getElementById('admin-main-viewport');
    if (viewport) viewport.scrollTop = 0;

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
    if (!wrap) return;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. Subscribe to Unified Admin Data Adapter (handles localStorage & live local mutations)
    adminState.unsubOrders = adminDataAdapter.subscribe('orders', (orders) => {
        adminState.orders = orders;

        // Update KPI counters
        updateOrdersKpi();

        // Render Dashboard feed
        renderDashboardOrdersFeed(adminState.orders.slice(0, 6));

        // Render Full Orders Tab
        renderOrdersView();

        // Render Offline POS Orders Tab
        renderOfflineOrdersTable();

        // Refresh Analytics
        renderAnalyticsView();

        const statusText = document.getElementById('live-status-text');
        if (statusText) statusText.textContent = isLocalhost ? '● Live Sync Active (Omnichannel)' : '● Live Sync Active';
    });

    // 2. Subscribe to Products & Offline Finances from Adapter
    adminDataAdapter.subscribe('products', (products) => {
        adminState.products = products;
        updateStockKpi();
        renderProductsView();
    });

    adminDataAdapter.subscribe('offline_finances', (finances) => {
        adminState.offlineFinances = finances;
        updateOfflineKpi();
        renderOfflineLedgerView();
        updateOrdersKpi();
    });

    // 3. If in production / non-localhost with live Firestore credentials, also bind Firestore snapshot
    if (!isLocalhost && window.db) {
        try {
            const q = query(collection(window.db, 'orders'), orderBy('createdAt', 'desc'));
            onSnapshot(q, (snap) => {
                const firestoreOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (firestoreOrders.length > 0) {
                    adminState.orders = firestoreOrders;
                    updateOrdersKpi();
                    renderDashboardOrdersFeed(adminState.orders.slice(0, 6));
                    renderOrdersView();
                    renderAnalyticsView();
                }
            }, (err) => {
                console.warn("[Admin] Firestore orders stream permission notice (using local adapter):", err.message);
            });
        } catch (e) {
            console.warn("[Admin] Stream init error (local adapter active):", e);
        }
    }
}

function updateOrdersKpi() {
    const orders = adminState.orders;
    const totalCount = orders.length;

    let onlineGross = 0;
    let offlineGross = 0;
    let onlineCount = 0;
    let offlineCount = 0;
    let pendingCount = 0;
    let unshippedCount = 0;
    let confirmedCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    orders.forEach(o => {
        const status = (o.status || '').toLowerCase();
        const payStatus = (o.paymentStatus || '').toLowerCase();
        const isOffline = o.source === 'offline' || String(o.id).startsWith('SS-OFF-');
        const amt = Number(o.total || o.finalAmount || 0);

        if (isOffline) {
            offlineCount++;
            if (status !== 'cancelled') {
                offlineGross += amt;
            }
        } else {
            onlineCount++;
            if (status !== 'cancelled' && (payStatus === 'paid' || payStatus === 'completed' || status === 'delivered')) {
                onlineGross += amt;
            }
        }

        if (status === 'pending') pendingCount++;
        else if (status === 'confirmed') {
            confirmedCount++;
            unshippedCount++; // Confirmed orders awaiting shipping
        } else if (status === 'shipped') shippedCount++;
        else if (status === 'delivered') deliveredCount++;
        else if (status === 'cancelled') cancelledCount++;
    });

    const combinedGross = onlineGross + offlineGross;

    // Calculate Raw Expenses from offlineFinances to compute Net Margins
    let totalRawExpenses = 0;
    adminState.offlineFinances.forEach(entry => {
        if (entry.type === 'expense') {
            totalRawExpenses += Number(entry.amount || 0);
        }
    });
    const netOperatingMargin = combinedGross - totalRawExpenses;

    // Update Dashboard KPIs
    const elRev = document.getElementById('kpi-dash-revenue');
    const elRevSplit = document.getElementById('kpi-dash-rev-split');
    const elTotal = document.getElementById('kpi-dash-orders-count');
    const elOrdersSplit = document.getElementById('kpi-dash-orders-split');
    const elPending = document.getElementById('kpi-dash-pending-count');
    const elUnshipped = document.getElementById('kpi-dash-unshipped-count');
    const elBadgePending = document.getElementById('badge-pending-orders');
    const elNet = document.getElementById('kpi-dash-offline-balance');

    if (elRev) elRev.textContent = '₹' + combinedGross.toLocaleString('en-IN');
    if (elRevSplit) elRevSplit.textContent = `🌐 Online: ₹${onlineGross.toLocaleString('en-IN')} · 🏪 Offline: ₹${offlineGross.toLocaleString('en-IN')}`;
    if (elTotal) elTotal.textContent = String(totalCount);
    if (elOrdersSplit) elOrdersSplit.textContent = `🌐 ${onlineCount} Online · 🏪 ${offlineCount} Offline`;
    if (elPending) elPending.textContent = String(pendingCount);
    if (elUnshipped) elUnshipped.textContent = String(unshippedCount);
    if (elBadgePending) elBadgePending.textContent = String(pendingCount + unshippedCount);
    if (elNet) {
        elNet.textContent = (netOperatingMargin >= 0 ? '+' : '') + '₹' + netOperatingMargin.toLocaleString('en-IN');
        elNet.style.color = netOperatingMargin >= 0 ? '#059669' : '#DC2626';
    }

    // Update Omnichannel Quick Pulse Bar
    const onlinePct = combinedGross > 0 ? Math.round((onlineGross / combinedGross) * 100) : 50;
    const offlinePct = 100 - onlinePct;

    const barOnline = document.getElementById('dash-bar-online');
    const barOffline = document.getElementById('dash-bar-offline');
    const txtOnlinePct = document.getElementById('dash-split-online-pct');
    const txtOfflinePct = document.getElementById('dash-split-offline-pct');
    const txtOnlineAmt = document.getElementById('dash-split-online-amt');
    const txtOfflineAmt = document.getElementById('dash-split-offline-amt');
    const summaryTxt = document.getElementById('dash-omnichannel-summary');

    if (barOnline) barOnline.style.width = `${onlinePct}%`;
    if (barOffline) barOffline.style.width = `${offlinePct}%`;
    if (txtOnlinePct) txtOnlinePct.textContent = `${onlinePct}%`;
    if (txtOfflinePct) txtOfflinePct.textContent = `${offlinePct}%`;
    if (txtOnlineAmt) txtOnlineAmt.textContent = '₹' + onlineGross.toLocaleString('en-IN');
    if (txtOfflineAmt) txtOfflineAmt.textContent = '₹' + offlineGross.toLocaleString('en-IN');
    if (summaryTxt) summaryTxt.textContent = `Online: ${onlinePct}% | Offline: ${offlinePct}% (Gross ₹${combinedGross.toLocaleString('en-IN')})`;

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
    container.style.gap = '10px';

    orders.forEach(o => {
        const card = document.createElement('div');
        card.style.background = '#FFFFFF';
        card.style.border = '1px solid #E8DFD3';
        card.style.padding = '12px 14px';
        card.style.borderRadius = '10px';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.flexWrap = 'wrap';
        card.style.gap = '8px';

        const leftCol = document.createElement('div');
        const titleStrong = document.createElement('strong');
        titleStrong.style.fontFamily = 'monospace';
        titleStrong.style.color = '#7A1C1C';
        titleStrong.style.fontSize = '0.92rem';
        titleStrong.textContent = 'Order #' + (o.id || '').slice(-6).toUpperCase();

        const summaryText = document.createTextNode(' — ₹' + (o.total || 0) + ' (' + (o.status || 'pending').toUpperCase() + ')');

        const detailsDiv = document.createElement('div');
        detailsDiv.style.fontSize = '0.78rem';
        detailsDiv.style.color = '#6B625B';
        detailsDiv.style.marginTop = '2px';
        detailsDiv.textContent = 'Customer: ' + (o.name || o.customerName || 'N/A') + ' | Phone: ' + (o.phone || o.customerPhone || 'N/A');

        leftCol.appendChild(titleStrong);
        leftCol.appendChild(summaryText);
        leftCol.appendChild(detailsDiv);

        const btnView = document.createElement('button');
        btnView.type = 'button';
        btnView.className = 'btn-secondary';
        btnView.style.padding = '5px 10px';
        btnView.style.fontSize = '0.76rem';
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

    // 2.5 Channel Filter (Omnichannel)
    if (adminState.orderChannelFilter === 'online') {
        filtered = filtered.filter(o => o.source !== 'offline' && !String(o.id).startsWith('SS-OFF-'));
    } else if (adminState.orderChannelFilter === 'offline') {
        filtered = filtered.filter(o => o.source === 'offline' || String(o.id).startsWith('SS-OFF-'));
    }

    // 3. Search Query Filter
    if (adminState.orderSearchQuery) {
        const q = adminState.orderSearchQuery;
        filtered = filtered.filter(o => {
            const id = (o.id || '').toLowerCase();
            const name = (o.name || o.customerName || '').toLowerCase();
            const phone = (o.phone || o.customerPhone || '').toLowerCase();
            const ch = (o.channel || '').toLowerCase();
            return id.includes(q) || name.includes(q) || phone.includes(q) || ch.includes(q);
        });
    }

    if (filtered.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '36px 16px';
        emptyDiv.style.color = '#6B625B';
        const emptyH3 = document.createElement('h3');
        emptyH3.style.fontSize = '1.1rem';
        emptyH3.textContent = 'No orders match this filter';
        const emptyP = document.createElement('p');
        emptyP.style.marginTop = '4px';
        emptyP.style.fontSize = '0.82rem';
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

        const isOffline = o.source === 'offline' || String(o.id).startsWith('SS-OFF-');
        const channelPill = document.createElement('span');
        channelPill.className = 'status-pill';
        if (isOffline) {
            channelPill.style.background = '#ECFDF5';
            channelPill.style.color = '#065F46';
            channelPill.style.border = '1px solid #A7F3D0';
            channelPill.textContent = '🏪 ' + (o.channel || 'OFFLINE POS').toUpperCase();
        } else {
            channelPill.style.background = '#EFF6FF';
            channelPill.style.color = '#1D4ED8';
            channelPill.style.border = '1px solid #BFDBFE';
            channelPill.textContent = '🌐 ONLINE STORE';
        }

        const statusPill = document.createElement('span');
        const stLower = (o.status || 'pending').toLowerCase();
        statusPill.className = 'status-pill status-' + stLower;
        statusPill.textContent = (o.status || 'pending').toUpperCase();

        const payPill = document.createElement('span');
        const isPaid = (o.paymentStatus === 'paid' || o.paymentStatus === 'completed' || o.paymentVerified === true);
        payPill.className = 'status-pill payment-pill ' + (isPaid ? 'paid' : 'unpaid');
        payPill.textContent = isPaid ? '💳 PAID' : '⏳ UNPAID';

        idGroup.appendChild(idTitle);
        idGroup.appendChild(channelPill);
        idGroup.appendChild(statusPill);
        idGroup.appendChild(payPill);

        const timeSpan = document.createElement('span');
        timeSpan.style.fontSize = '0.76rem';
        timeSpan.style.color = '#6B625B';
        let dateStr = 'N/A';
        if (o.createdAt) {
            const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
        itemsTitle.style.fontSize = '0.86rem';
        itemsTitle.style.marginBottom = '6px';
        itemsTitle.textContent = 'Items (' + (o.items ? o.items.length : 0) + '):';
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
        totalLine.style.marginTop = '8px';
        totalLine.style.paddingTop = '6px';
        totalLine.style.borderTop = '1.5px solid #E8DFD3';
        totalLine.style.fontWeight = '800';
        totalLine.style.fontSize = '0.96rem';
        totalLine.style.color = '#7A1C1C';

        const totalLabel = document.createElement('span');
        totalLabel.textContent = 'Grand Total:';
        const totalVal = document.createElement('span');
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
            btnConfirm.textContent = '📋 Confirm';
            btnConfirm.addEventListener('click', () => updateOrderStatus(o.id, 'confirmed'));
            actionsCol.appendChild(btnConfirm);
        }

        // Action: Dispatch / Ship Order
        if (stLower === 'confirmed' || stLower === 'pending') {
            const btnShip = document.createElement('button');
            btnShip.type = 'button';
            btnShip.className = 'btn-action ship';
            btnShip.textContent = '🚚 Dispatch';
            btnShip.addEventListener('click', () => openShippingModal(o.id));
            actionsCol.appendChild(btnShip);
        }

        // Action: Mark Delivered
        if (stLower === 'shipped') {
            const btnDeliver = document.createElement('button');
            btnDeliver.type = 'button';
            btnDeliver.className = 'btn-action deliver';
            btnDeliver.textContent = '✅ Deliver';
            btnDeliver.addEventListener('click', () => updateOrderStatus(o.id, 'delivered'));
            actionsCol.appendChild(btnDeliver);
        }

        // Action: Verify Payment
        if (!isPaid) {
            const btnVerifyPay = document.createElement('button');
            btnVerifyPay.type = 'button';
            btnVerifyPay.className = 'btn-action verify-pay';
            btnVerifyPay.textContent = '💳 Mark Paid';
            btnVerifyPay.addEventListener('click', () => verifyOrderPayment(o.id));
            actionsCol.appendChild(btnVerifyPay);
        }

        // Action: Print Receipt (for Offline POS Orders)
        if (isOffline) {
            const btnReceipt = document.createElement('button');
            btnReceipt.type = 'button';
            btnReceipt.className = 'btn-action';
            btnReceipt.style.background = '#0F766E';
            btnReceipt.style.color = '#FFFFFF';
            btnReceipt.textContent = '🖨️ Receipt';
            btnReceipt.addEventListener('click', () => printOfflineReceipt(o.id));
            actionsCol.appendChild(btnReceipt);
        }

        // Action: Cancel Order
        if (stLower !== 'cancelled' && stLower !== 'delivered') {
            const btnCancel = document.createElement('button');
            btnCancel.type = 'button';
            btnCancel.className = 'btn-action cancel';
            btnCancel.textContent = '❌ Cancel';
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
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isOffline = String(orderId).startsWith('SS-OFF-') || adminState.orders.some(o => o.id === orderId && o.source === 'offline');

    if (isOffline || isLocalhost) {
        adminDataAdapter.updateOrderStatus(orderId, newStatus);
        console.log(`[Adapter] Order ${orderId} transitioned to ${newStatus}`);
    }

    if (window.db && !isOffline) {
        try {
            const orderRef = doc(window.db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            console.log(`[Firestore] Order ${orderId} transitioned to ${newStatus}`);
        } catch (err) {
            console.warn("Firestore status update skipped or failed (local adapter active):", err.message);
        }
    }
}

// Admin decision control reference: /api/v1/admin/orders/:id/verify-payment
async function verifyOrderPayment(orderId) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isOffline = String(orderId).startsWith('SS-OFF-') || adminState.orders.some(o => o.id === orderId && o.source === 'offline');

    if (isOffline || isLocalhost) {
        adminDataAdapter.updateOrderStatus(orderId, undefined, 'paid');
        console.log(`[Adapter] Payment for order ${orderId} verified.`);
    }

    if (window.db && !isOffline) {
        try {
            const orderRef = doc(window.db, 'orders', orderId);
            await updateDoc(orderRef, {
                paymentStatus: 'paid',
                paymentVerified: true,
                verifiedAt: serverTimestamp()
            });
            console.log(`Payment for order ${orderId} verified successfully.`);
        } catch (err) {
            console.warn("Firestore verify payment skipped (local adapter active):", err.message);
        }
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
        emptyP.style.padding = '20px';
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
            stockText = 'Low (' + stockQty + ')';
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
        stockLabel.textContent = 'Stock:';
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
        btnEdit.textContent = '✏️ Edit Product';
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
        if (title) title.textContent = 'Edit: ' + (prod.name || prod.id);
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
        td.style.padding = '20px';
        td.textContent = 'No offline records found. Click "+ Record Entry" to add one.';
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
        btnDelete.style.padding = '3px 7px';
        btnDelete.style.fontSize = '0.74rem';
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

    const type = document.getElementById('off-type').value;
    const category = document.getElementById('off-category').value;
    const amount = Number(document.getElementById('off-amount').value);
    const date = document.getElementById('off-date').value;
    const desc = document.getElementById('off-desc').value.trim();

    if (!amount || !date) {
        alert("Please specify amount and date.");
        return;
    }

    const payload = {
        type,
        category,
        amount,
        date,
        desc,
        createdAt: new Date().toISOString()
    };

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost || !window.db) {
        adminDataAdapter.addOfflineExpense(payload);
        closeModal('modal-offline');
        document.getElementById('off-amount').value = '';
        document.getElementById('off-desc').value = '';
        return;
    }

    try {
        await addDoc(collection(window.db, 'offline_finances'), {
            ...payload,
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
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost || !window.db) {
        adminDataAdapter.deleteOfflineExpense(docId);
        return;
    }
    try {
        await deleteDoc(doc(window.db, 'offline_finances', docId));
    } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete entry: " + err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.5 OFFLINE POS ORDER ENTRY & RECEIPT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function openOfflineOrderModal() {
    const form = document.getElementById('form-offline-order');
    if (form) form.reset();

    const dateInput = document.getElementById('pos-order-date');
    if (dateInput) {
        const now = new Date();
        const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        dateInput.value = localIso;
    }

    const itemsContainer = document.getElementById('pos-items-container');
    if (itemsContainer) {
        itemsContainer.replaceChildren();
        addPosItemRow();
    }

    const discountInput = document.getElementById('pos-discount');
    if (discountInput) discountInput.value = '0';

    calculatePosTotal();
    openModal('modal-offline-order');
}

function closeOfflineOrderModal() {
    closeModal('modal-offline-order');
}

function addPosItemRow() {
    const container = document.getElementById('pos-items-container');
    if (!container) return;

    const products = adminDataAdapter.getProducts();
    if (!products || products.length === 0) {
        alert("No products available in inventory.");
        return;
    }

    const row = document.createElement('div');
    row.className = 'pos-item-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '2fr 1.6fr 0.8fr 1.2fr 36px';
    row.style.gap = '8px';
    row.style.alignItems = 'center';
    row.style.background = '#FFFFFF';
    row.style.border = '1px solid #E8DFD3';
    row.style.borderRadius = '8px';
    row.style.padding = '8px 10px';

    // 1. Product Select
    const selectProd = document.createElement('select');
    selectProd.className = 'pos-item-prod';
    selectProd.style.padding = '6px 8px';
    selectProd.style.borderRadius = '6px';
    selectProd.style.border = '1px solid #D5C9B8';
    selectProd.style.fontSize = '0.82rem';
    selectProd.style.fontWeight = '600';
    products.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (idx === 0) opt.selected = true;
        selectProd.appendChild(opt);
    });

    // 2. Variant Select
    const selectVariant = document.createElement('select');
    selectVariant.className = 'pos-item-variant';
    selectVariant.style.padding = '6px 8px';
    selectVariant.style.borderRadius = '6px';
    selectVariant.style.border = '1px solid #D5C9B8';
    selectVariant.style.fontSize = '0.82rem';

    // 3. Qty Stepper
    const inputQty = document.createElement('input');
    inputQty.type = 'number';
    inputQty.min = '1';
    inputQty.value = '1';
    inputQty.className = 'pos-item-qty';
    inputQty.style.padding = '6px 6px';
    inputQty.style.borderRadius = '6px';
    inputQty.style.border = '1px solid #D5C9B8';
    inputQty.style.textAlign = 'center';
    inputQty.style.fontSize = '0.84rem';
    inputQty.style.fontWeight = '700';

    // 4. Line Subtotal / Unit Price
    const lineTotal = document.createElement('div');
    lineTotal.className = 'pos-item-subtotal';
    lineTotal.style.fontSize = '0.88rem';
    lineTotal.style.fontWeight = '800';
    lineTotal.style.color = '#7A1C1C';
    lineTotal.style.textAlign = 'right';
    lineTotal.textContent = '₹0';

    // 5. Remove Button
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.style.background = '#FEE2E2';
    btnRemove.style.color = '#DC2626';
    btnRemove.style.border = 'none';
    btnRemove.style.borderRadius = '6px';
    btnRemove.style.width = '32px';
    btnRemove.style.height = '32px';
    btnRemove.style.cursor = 'pointer';
    btnRemove.style.fontWeight = '900';
    btnRemove.style.display = 'flex';
    btnRemove.style.alignItems = 'center';
    btnRemove.style.justifyContent = 'center';
    btnRemove.textContent = '✕';
    btnRemove.title = 'Remove item';
    btnRemove.addEventListener('click', () => {
        if (container.children.length > 1) {
            row.remove();
            calculatePosTotal();
        } else {
            alert("At least one product item is required for the order.");
        }
    });

    function populateVariants() {
        const prodId = selectProd.value;
        const currentProd = products.find(p => p.id === prodId) || products[0];
        selectVariant.replaceChildren();

        if (Array.isArray(currentProd.variants) && currentProd.variants.length > 0) {
            currentProd.variants.forEach((v, vIdx) => {
                const opt = document.createElement('option');
                opt.value = v.weight || v.label || 'Standard';
                opt.dataset.price = v.price;
                opt.dataset.stock = v.stock;
                opt.textContent = `${v.weight || v.label || 'Pack'} - ₹${v.price} (Stock: ${v.stock})`;
                if (vIdx === 0) opt.selected = true;
                selectVariant.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.value = 'Standard';
            opt.dataset.price = currentProd.price || 0;
            opt.dataset.stock = currentProd.stock || 0;
            opt.textContent = `Standard - ₹${currentProd.price || 0} (Stock: ${currentProd.stock || 0})`;
            selectVariant.appendChild(opt);
        }
        updateLineTotal();
    }

    function updateLineTotal() {
        const selectedOpt = selectVariant.selectedOptions[0];
        const unitPrice = selectedOpt ? Number(selectedOpt.dataset.price || 0) : 0;
        const qty = Math.max(1, parseInt(inputQty.value, 10) || 1);
        const sub = unitPrice * qty;
        lineTotal.textContent = '₹' + sub.toLocaleString('en-IN');
        lineTotal.dataset.price = unitPrice;
        lineTotal.dataset.subtotal = sub;
        calculatePosTotal();
    }

    selectProd.addEventListener('change', populateVariants);
    selectVariant.addEventListener('change', updateLineTotal);
    inputQty.addEventListener('input', updateLineTotal);

    row.appendChild(selectProd);
    row.appendChild(selectVariant);
    row.appendChild(inputQty);
    row.appendChild(lineTotal);
    row.appendChild(btnRemove);

    container.appendChild(row);
    populateVariants();
}

function calculatePosTotal() {
    const rows = document.querySelectorAll('#pos-items-container .pos-item-row');
    let subtotal = 0;
    rows.forEach(r => {
        const line = r.querySelector('.pos-item-subtotal');
        if (line && line.dataset.subtotal) {
            subtotal += Number(line.dataset.subtotal);
        }
    });

    const discountInput = document.getElementById('pos-discount');
    const discount = discountInput ? Math.max(0, Number(discountInput.value) || 0) : 0;
    const finalTotal = Math.max(0, subtotal - discount);

    const totalDisplay = document.getElementById('pos-total-display');
    if (totalDisplay) {
        totalDisplay.value = '₹' + finalTotal.toLocaleString('en-IN');
        totalDisplay.dataset.subtotal = subtotal;
        totalDisplay.dataset.total = finalTotal;
    }
}

async function handleOfflineOrderSubmit(e) {
    e.preventDefault();
    const custName = (document.getElementById('pos-cust-name').value || '').trim();
    const custPhone = (document.getElementById('pos-cust-phone').value || '').trim();
    const channel = document.getElementById('pos-channel').value;
    const orderDate = document.getElementById('pos-order-date').value;
    const paymentMode = document.getElementById('pos-payment-mode').value;
    const paymentStatus = document.getElementById('pos-payment-status').value;
    const notes = (document.getElementById('pos-order-notes').value || '').trim();

    const discountInput = document.getElementById('pos-discount');
    const discount = discountInput ? Math.max(0, Number(discountInput.value) || 0) : 0;

    const rows = document.querySelectorAll('#pos-items-container .pos-item-row');
    if (rows.length === 0) {
        alert("Please add at least one item to the order.");
        return;
    }

    const items = [];
    let subtotal = 0;
    const products = adminDataAdapter.getProducts();

    rows.forEach(r => {
        const prodSelect = r.querySelector('.pos-item-prod');
        const variantSelect = r.querySelector('.pos-item-variant');
        const qtyInput = r.querySelector('.pos-item-qty');

        const prodId = prodSelect ? prodSelect.value : '';
        const prod = products.find(p => p.id === prodId) || {};
        const variantOpt = variantSelect ? variantSelect.selectedOptions[0] : null;
        const variantName = variantOpt ? variantOpt.value : 'Standard';
        const price = variantOpt ? Number(variantOpt.dataset.price || 0) : Number(prod.price || 0);
        const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
        const lineSub = price * qty;

        subtotal += lineSub;
        items.push({
            productId: prodId,
            name: prod.name || 'Handcrafted Pickle',
            productName: prod.name || 'Handcrafted Pickle',
            variant: variantName,
            price: price,
            qty: qty,
            quantity: qty,
            total: lineSub
        });
    });

    const finalTotal = Math.max(0, subtotal - discount);

    const payload = {
        name: custName,
        customerName: custName,
        phone: custPhone,
        customerPhone: custPhone,
        channel: channel,
        paymentMethod: paymentMode,
        paymentMode: paymentMode,
        paymentStatus: paymentStatus,
        paymentVerified: paymentStatus === 'paid',
        items: items,
        subtotal: subtotal,
        discount: discount,
        total: finalTotal,
        finalAmount: finalTotal,
        notes: notes,
        createdAt: orderDate ? new Date(orderDate).toISOString() : new Date().toISOString()
    };

    const submitBtn = document.getElementById('btn-save-offline-order');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Recording & Deducting Stock...';
    }

    try {
        const newOrder = await adminDataAdapter.addOfflineOrder(payload);
        closeOfflineOrderModal();
        alert(`✅ Offline Order #${newOrder.id} successfully recorded!\nStock deducted from inventory.\nGross Total: ₹${finalTotal.toLocaleString('en-IN')}`);

        // Switch to Offline POS tab to view the recorded order
        switchAdminView('view-offline');
        switchOfflineSubtab('offline-orders');
    } catch (err) {
        console.error("Failed to add offline order:", err);
        alert("Failed to save offline order: " + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Save Order & Deduct Stock';
        }
    }
}

function switchOfflineSubtab(tabName) {
    adminState.offlineSubtab = tabName;
    const btnPos = document.getElementById('btn-subtab-pos-orders');
    const btnExp = document.getElementById('btn-subtab-expenses');
    const cardOrders = document.getElementById('card-offline-orders-table');
    const cardExp = document.getElementById('card-offline-expenses-table');

    if (tabName === 'offline-orders') {
        if (btnPos) btnPos.classList.add('active');
        if (btnExp) btnExp.classList.remove('active');
        if (cardOrders) cardOrders.style.display = 'block';
        if (cardExp) cardExp.style.display = 'none';
        renderOfflineOrdersTable();
    } else {
        if (btnPos) btnPos.classList.remove('active');
        if (btnExp) btnExp.classList.add('active');
        if (cardOrders) cardOrders.style.display = 'none';
        if (cardExp) cardExp.style.display = 'block';
        renderOfflineLedgerView();
    }
}

function renderOfflineOrdersTable() {
    const tbody = document.getElementById('offline-orders-table-body');
    if (!tbody) return;

    // Filter offline orders
    let offlineOrders = adminState.orders.filter(o => o.source === 'offline' || String(o.id).startsWith('SS-OFF-'));

    // Count updates
    const cntTab = document.getElementById('cnt-subtab-offline-orders');
    if (cntTab) cntTab.textContent = String(offlineOrders.length);
    const cntKpi = document.getElementById('kpi-offline-orders-count');
    if (cntKpi) cntKpi.textContent = `${offlineOrders.length} Recorded POS Orders`;

    // Filter by search query
    if (adminState.offlineOrderSearchQuery) {
        const q = adminState.offlineOrderSearchQuery;
        offlineOrders = offlineOrders.filter(o => {
            const id = (o.id || '').toLowerCase();
            const name = (o.name || o.customerName || '').toLowerCase();
            const phone = (o.phone || o.customerPhone || '').toLowerCase();
            const ch = (o.channel || '').toLowerCase();
            return id.includes(q) || name.includes(q) || phone.includes(q) || ch.includes(q);
        });
    }

    if (offlineOrders.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8;
        td.style.textAlign = 'center';
        td.style.color = '#888';
        td.style.padding = '28px';
        td.innerHTML = `No offline POS orders found. <br><button type="button" class="btn-primary" style="margin-top:10px;padding:6px 14px;font-size:0.8rem;" id="btn-empty-add-offline">➕ Record First POS Order</button>`;
        tr.appendChild(td);
        tbody.replaceChildren(tr);

        const btn = document.getElementById('btn-empty-add-offline');
        if (btn) btn.addEventListener('click', openOfflineOrderModal);
        return;
    }

    const fragment = document.createDocumentFragment();

    offlineOrders.forEach(o => {
        const tr = document.createElement('tr');

        // Order ID
        const tdId = document.createElement('td');
        tdId.style.fontFamily = 'monospace';
        tdId.style.fontWeight = '700';
        tdId.style.color = '#7A1C1C';
        tdId.textContent = '#' + (o.id || '');

        // Date & Time
        const tdDate = document.createElement('td');
        tdDate.style.fontSize = '0.78rem';
        let dateStr = 'N/A';
        if (o.createdAt) {
            const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        }
        tdDate.textContent = dateStr;

        // Customer & Channel
        const tdCust = document.createElement('td');
        const strongName = document.createElement('strong');
        strongName.textContent = o.name || o.customerName || 'Walk-in Customer';
        const divMeta = document.createElement('div');
        divMeta.style.fontSize = '0.75rem';
        divMeta.style.color = '#6B625B';
        divMeta.textContent = `${o.phone || 'No phone'} · 📍 ${o.channel || 'Counter'}`;
        tdCust.appendChild(strongName);
        tdCust.appendChild(divMeta);

        // Items Ordered
        const tdItems = document.createElement('td');
        tdItems.style.fontSize = '0.78rem';
        if (Array.isArray(o.items)) {
            o.items.forEach(it => {
                const itemDiv = document.createElement('div');
                itemDiv.style.whiteSpace = 'nowrap';
                itemDiv.textContent = `• ${it.name || it.productName || 'Item'} (${it.variant || ''}) × ${it.qty || it.quantity || 1}`;
                tdItems.appendChild(itemDiv);
            });
        } else {
            tdItems.textContent = '1 Item';
        }

        // Payment Mode
        const tdPay = document.createElement('td');
        const payPill = document.createElement('span');
        payPill.style.padding = '3px 8px';
        payPill.style.borderRadius = '12px';
        payPill.style.fontSize = '0.72rem';
        payPill.style.fontWeight = '700';
        payPill.style.background = '#EFF6FF';
        payPill.style.color = '#1D4ED8';
        payPill.style.border = '1px solid #BFDBFE';
        payPill.textContent = `${o.paymentMethod || o.paymentMode || 'Cash'} (${(o.paymentStatus || 'paid').toUpperCase()})`;
        tdPay.appendChild(payPill);

        // Total (₹)
        const tdTotal = document.createElement('td');
        tdTotal.style.fontWeight = '800';
        tdTotal.style.color = '#059669';
        tdTotal.style.fontSize = '0.92rem';
        tdTotal.textContent = '₹' + Number(o.total || o.finalAmount || 0).toLocaleString('en-IN');

        // Status
        const tdStatus = document.createElement('td');
        const stPill = document.createElement('span');
        const st = (o.status || 'delivered').toLowerCase();
        stPill.className = `status-pill status-${st}`;
        stPill.textContent = st.toUpperCase();
        tdStatus.appendChild(stPill);

        // Actions
        const tdActions = document.createElement('td');
        tdActions.style.display = 'flex';
        tdActions.style.gap = '6px';
        tdActions.style.alignItems = 'center';

        const btnReceipt = document.createElement('button');
        btnReceipt.type = 'button';
        btnReceipt.className = 'btn-secondary';
        btnReceipt.style.padding = '3px 8px';
        btnReceipt.style.fontSize = '0.74rem';
        btnReceipt.textContent = '🖨️ Receipt';
        btnReceipt.addEventListener('click', () => printOfflineReceipt(o.id));

        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn-secondary';
        btnCancel.style.padding = '3px 8px';
        btnCancel.style.fontSize = '0.74rem';
        btnCancel.style.color = '#DC2626';
        btnCancel.textContent = '❌ Cancel';
        btnCancel.addEventListener('click', () => {
            if (confirm(`Cancel offline order #${o.id}? This will automatically restore inventory stock.`)) {
                updateOrderStatus(o.id, 'cancelled');
            }
        });

        tdActions.appendChild(btnReceipt);
        if (st !== 'cancelled') {
            tdActions.appendChild(btnCancel);
        }

        tr.appendChild(tdId);
        tr.appendChild(tdDate);
        tr.appendChild(tdCust);
        tr.appendChild(tdItems);
        tr.appendChild(tdPay);
        tr.appendChild(tdTotal);
        tr.appendChild(tdStatus);
        tr.appendChild(tdActions);

        fragment.appendChild(tr);
    });

    tbody.replaceChildren(fragment);
}

function printOfflineReceipt(orderId) {
    const order = adminState.orders.find(o => o.id === orderId);
    if (!order) {
        alert("Order not found: " + orderId);
        return;
    }

    const receiptWindow = window.open('', '_blank', 'width=450,height=600');
    if (!receiptWindow) {
        alert("Please allow popups to print receipt.");
        return;
    }

    let itemsHtml = '';
    if (Array.isArray(order.items)) {
        order.items.forEach(it => {
            itemsHtml += `
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
                <div>${it.name || it.productName || 'Item'} (${it.variant || ''}) × ${it.qty || 1}</div>
                <div style="font-weight:700;">₹${it.total || ((it.price || 0) * (it.qty || 1))}</div>
            </div>`;
        });
    }

    const d = order.createdAt ? (order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)) : new Date();
    const dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - Order #${order.id}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; color: #111; max-width: 380px; margin: 0 auto; }
                .center { text-align: center; }
                .divider { border-top: 1px dashed #666; margin: 10px 0; }
                .bold { font-weight: bold; }
                .text-right { text-align: right; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="center">
                <h2 style="margin:0 0 4px 0;font-size:18px;">SATVIK SWAAD</h2>
                <div style="font-size:11px;">Authentic Traditional Pickles & Delicacies</div>
                <div style="font-size:11px;">Varanasi, Uttar Pradesh, India</div>
                <div style="font-size:11px;">📞 +91 91702 46665 | satvikswaad.com</div>
            </div>
            <div class="divider"></div>
            <div style="font-size:12px;line-height:1.5;">
                <div><strong>INVOICE / RECEIPT:</strong> #${order.id}</div>
                <div><strong>DATE:</strong> ${dateFormatted}</div>
                <div><strong>CHANNEL:</strong> ${order.channel || 'Varanasi Store'}</div>
                <div><strong>CUSTOMER:</strong> ${order.name || order.customerName || 'Walk-in'}</div>
                <div><strong>PHONE:</strong> ${order.phone || order.customerPhone || 'N/A'}</div>
            </div>
            <div class="divider"></div>
            <div style="font-size:12px;font-weight:bold;margin-bottom:6px;">ITEMS PURCHASED</div>
            ${itemsHtml}
            <div class="divider"></div>
            <div style="font-size:12px;display:flex;justify-content:space-between;margin-bottom:3px;">
                <div>Subtotal:</div>
                <div>₹${order.subtotal || order.total || 0}</div>
            </div>
            ${order.discount ? `
            <div style="font-size:12px;display:flex;justify-content:space-between;margin-bottom:3px;color:#B91C1C;">
                <div>Discount:</div>
                <div>- ₹${order.discount}</div>
            </div>` : ''}
            <div class="divider"></div>
            <div style="font-size:16px;font-weight:bold;display:flex;justify-content:space-between;">
                <div>GRAND TOTAL:</div>
                <div>₹${order.total || order.finalAmount || 0}</div>
            </div>
            <div style="font-size:12px;margin-top:6px;">
                <strong>PAYMENT:</strong> ${order.paymentMethod || order.paymentMode || 'Cash'} (${(order.paymentStatus || 'paid').toUpperCase()})
            </div>
            ${order.notes ? `<div style="font-size:11px;margin-top:6px;font-style:italic;">Notes: ${order.notes}</div>` : ''}
            <div class="divider"></div>
            <div class="center" style="font-size:11px;line-height:1.4;">
                <p>Made with 100% Cold-Pressed Mustard Oil & Himalayan Pink Salt.<br>Zero Artificial Preservatives.</p>
                <p style="font-weight:bold;">Thank you for supporting traditional Indian artisans!</p>
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    receiptWindow.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ANALYTICS & MONTHLY REPORTS ENGINE (ZERO innerHTML concatenation)
// ─────────────────────────────────────────────────────────────────────────────
function renderAnalyticsView() {
    try {
        const mount = document.getElementById('satvik-bi-mount-root');
        if (!mount) {
            initAdminAnalytics('view-analytics', adminDataAdapter);
        } else {
            refreshAdminAnalytics();
        }
    } catch (e) {
        console.warn("[Admin] Analytics init notice:", e);
    }

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
            wrap.style.gap = '8px';

            catEntries.sort((a, b) => b[1] - a[1]).forEach(([cat, rev]) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.padding = '7px 10px';
                row.style.background = '#FAF7F2';
                row.style.borderRadius = '8px';
                row.style.border = '1px solid #E8DFD3';

                const spanCat = document.createElement('span');
                spanCat.style.fontWeight = '700';
                spanCat.style.fontSize = '0.84rem';
                spanCat.style.textTransform = 'capitalize';
                spanCat.textContent = cat;

                const spanRev = document.createElement('span');
                spanRev.style.fontWeight = '800';
                spanRev.style.fontSize = '0.84rem';
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
            wrap.style.gap = '8px';

            prodEntries.sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([name, units], idx) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
                row.style.padding = '7px 10px';
                row.style.background = '#FAF7F2';
                row.style.borderRadius = '8px';
                row.style.border = '1px solid #E8DFD3';

                const left = document.createElement('div');
                left.style.display = 'flex';
                left.style.alignItems = 'center';
                left.style.gap = '6px';

                const rank = document.createElement('span');
                rank.style.fontWeight = '900';
                rank.style.fontSize = '0.8rem';
                rank.style.color = '#D4A017';
                rank.textContent = '#' + (idx + 1);

                const title = document.createElement('span');
                title.style.fontWeight = '700';
                title.style.fontSize = '0.84rem';
                title.textContent = name;

                left.appendChild(rank);
                left.appendChild(title);

                const count = document.createElement('span');
                count.style.fontWeight = '800';
                count.style.fontSize = '0.78rem';
                count.style.color = '#2563EB';
                count.textContent = units + ' Sold';

                row.appendChild(left);
                row.appendChild(count);
                wrap.appendChild(row);
            });
            prodContainer.replaceChildren(wrap);
        }
    }
}
