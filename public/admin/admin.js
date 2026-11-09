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
    reviews: [],
    reviewsFilter: 'all',
    reviewsSearchQuery: '',
    subscribers: [],
    subscribersFilter: 'all',
    subscribersSearchQuery: '',
    subscribersFormat: 'comma',
    unsubOrders: null,
    unsubProducts: null,
    unsubOffline: null,
    unsubReviews: null
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

    // Reviews & Testimonials Filter Tabs
    const reviewsFilterTabs = document.querySelectorAll('#reviews-filter-tabs .filter-tab');
    reviewsFilterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            reviewsFilterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            adminState.reviewsFilter = tab.getAttribute('data-filter') || 'all';
            renderReviewsManagement();
        });
    });

    // Reviews Search Input
    const inputSearchReviews = document.getElementById('input-search-reviews');
    if (inputSearchReviews) {
        inputSearchReviews.addEventListener('input', (e) => {
            adminState.reviewsSearchQuery = e.target.value.trim().toLowerCase();
            renderReviewsManagement();
        });
    }

    // Publish to Homepage Marquee Button
    const btnPublishReviews = document.getElementById('btn-publish-reviews');
    if (btnPublishReviews) {
        btnPublishReviews.addEventListener('click', () => {
            if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.publishFeaturedReviews === 'function') {
                const list = adminDataAdapter.publishFeaturedReviews();
                showAdminToast('🚀 Published ' + list.length + ' curated reviews to Homepage!', 'success');
            } else {
                showAdminToast('⭐ Reviews saved!', 'success');
            }
        });
    }

    // Modal: Add Customer Review / Testimonial
    const btnOpenAddReviewModal = document.getElementById('btn-open-add-review-modal');
    if (btnOpenAddReviewModal) {
        btnOpenAddReviewModal.addEventListener('click', () => openModal('modal-add-review'));
    }
    const btnCloseAddReviewModal = document.getElementById('btn-close-add-review-modal');
    if (btnCloseAddReviewModal) {
        btnCloseAddReviewModal.addEventListener('click', () => closeModal('modal-add-review'));
    }
    const btnCancelAddReviewModal = document.getElementById('btn-cancel-add-review-modal');
    if (btnCancelAddReviewModal) {
        btnCancelAddReviewModal.addEventListener('click', () => closeModal('modal-add-review'));
    }
    const formAddReview = document.getElementById('form-add-review');
    if (formAddReview) {
        formAddReview.addEventListener('submit', async (e) => {
            e.preventDefault();
            const author = document.getElementById('rev-author').value.trim();
            const city = document.getElementById('rev-city').value.trim();
            const productName = document.getElementById('rev-product').value;
            const rating = Number(document.getElementById('rev-rating').value);
            const title = document.getElementById('rev-title').value.trim();
            const text = document.getElementById('rev-text').value.trim();
            const featured = document.getElementById('rev-featured').checked;

            try {
                await adminDataAdapter.addReview({
                    author,
                    customerName: author,
                    city,
                    productName,
                    rating,
                    title,
                    text,
                    featured,
                    verified: true
                });
                closeModal('modal-add-review');
                formAddReview.reset();
                showAdminToast(`⭐ Testimonial from "${author}" added successfully!`, 'success');
                updateReviewsKpi();
                renderReviewsManagement();
            } catch (err) {
                console.error("Add review error:", err);
                showAdminToast(`Error saving testimonial: ${err.message}`, 'error');
            }
        });
    }

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
    updateSubscribersBadge();
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

// Safe Toast Notifications (Uses textContent to prevent DOM XSS)
export function showAdminToast(msg, type = 'info') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'admin-toast toast-' + type;
    if (type === 'error') {
        toast.style.borderLeftColor = '#EF4444';
        toast.style.background = '#3B1818';
    } else if (type === 'warning') {
        toast.style.borderLeftColor = '#F59E0B';
        toast.style.background = '#3D2F14';
    } else if (type === 'success') {
        toast.style.borderLeftColor = '#10B981';
        toast.style.background = '#143323';
    } else {
        toast.style.borderLeftColor = '#D4AF37';
        toast.style.background = '#203325';
    }
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
if (typeof window !== 'undefined') {
    window.showAdminToast = showAdminToast;
}

// Strict Image URL Validator (prevents javascript: or executable injection)
export function isValidImageUrl(url) {
    if (typeof url !== 'string') return false;
    const clean = url.trim();
    if (!clean) return false;
    if (/^(https?:\/\/|\/|\.\/|assets\/)/i.test(clean)) return true;
    if (/^data:image\/(jpeg|png|webp|gif);base64,/i.test(clean)) return true;
    return false;
}
if (typeof window !== 'undefined') {
    window.isValidImageUrl = isValidImageUrl;
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
    if (viewId === 'view-reviews') renderReviewsManagement();
    if (viewId === 'view-subscribers') renderSubscribersView();
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
    if (adminState.unsubReviews) { adminState.unsubReviews(); adminState.unsubReviews = null; }
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

    adminState.unsubReviews = adminDataAdapter.subscribe('reviews', (reviews) => {
        adminState.reviews = reviews;
        updateReviewsKpi();
        if (adminState.activeView === 'view-reviews') {
            renderReviewsManagement();
        }
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
        const defaultAsset = 'assets/aam-ka-achar.png';
        const rawImg = (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.image || p.img || defaultAsset);
        img.src = rawImg;
        img.alt = p.name || 'Product';
        img.onerror = () => { img.src = defaultAsset; };

        // Multi-image count indicator badge
        if (Array.isArray(p.images) && p.images.length > 1) {
            const imgCountBadge = document.createElement('span');
            imgCountBadge.style.cssText = 'position:absolute;bottom:8px;right:8px;background:rgba(20,20,20,0.75);color:#FFF;font-size:0.7rem;font-weight:700;padding:2px 7px;border-radius:12px;backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.2);';
            imgCountBadge.textContent = '📷 ' + p.images.length + ' photos';
            thumbWrap.appendChild(imgCountBadge);
        }

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

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT EDIT / CREATE MODAL & MULTI-IMAGE ATTACHMENT MANAGER (Min 1, Max 5)
// ─────────────────────────────────────────────────────────────────────────────
let currentModalImages = [];
let imgAttachmentHandlersBound = false;

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
    const fieldDesc = document.getElementById('prod-field-desc');
    const fieldAvail = document.getElementById('prod-field-available');
    const validationMsg = document.getElementById('prod-images-validation-msg');
    if (validationMsg) validationMsg.style.display = 'none';

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
        if (fieldDesc) fieldDesc.value = prod.desc || prod.description || '';
        if (fieldAvail) fieldAvail.checked = prod.available !== false;

        // Populate attached images array
        if (Array.isArray(prod.images) && prod.images.length > 0) {
            currentModalImages = prod.images.slice(0, 5);
        } else if (prod.image || prod.img) {
            currentModalImages = [prod.image || prod.img];
        } else {
            currentModalImages = ['assets/aam-ka-achar.png'];
        }
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
        if (fieldDesc) fieldDesc.value = 'Authentic homemade recipe prepared with cold-pressed mustard oil.';
        if (fieldAvail) fieldAvail.checked = true;

        currentModalImages = ['assets/aam-ka-achar.png'];
    }

    renderModalAttachedImages();
    initProductImageAttachmentHandlers();
    openModal('modal-product');
}

function closeProductModal() {
    closeModal('modal-product');
}

function renderModalAttachedImages() {
    const grid = document.getElementById('prod-attached-images-grid');
    const badge = document.getElementById('prod-images-count-badge');
    const validationMsg = document.getElementById('prod-images-validation-msg');

    if (badge) {
        badge.textContent = `${currentModalImages.length} / 5 Attached`;
        badge.style.background = currentModalImages.length === 0 ? '#FEE2E2' : currentModalImages.length >= 5 ? '#FEF3C7' : '#FDF2F0';
        badge.style.color = currentModalImages.length === 0 ? '#DC2626' : currentModalImages.length >= 5 ? '#92400E' : '#7A1C1C';
    }

    if (!grid) return;

    if (currentModalImages.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'grid-column: 1/-1; padding: 18px 10px; text-align: center; color: #DC2626; font-size: 0.82rem; font-weight: 700;';
        emptyDiv.textContent = '⚠️ No pictures attached! Please upload or attach at least 1 product picture (Max 5).';
        grid.replaceChildren(emptyDiv);
        return;
    }

    const frag = document.createDocumentFragment();

    currentModalImages.forEach((imgUrl, idx) => {
        const card = document.createElement('div');
        card.className = 'prod-attached-card' + (idx === 0 ? ' is-cover' : '');

        const img = document.createElement('img');
        img.className = 'prod-attached-img';
        img.src = imgUrl;
        img.alt = `Product Photo ${idx + 1}`;
        img.onerror = () => { img.src = 'assets/aam-ka-achar.png'; };
        card.appendChild(img);

        if (idx === 0) {
            const coverTag = document.createElement('span');
            coverTag.className = 'prod-cover-badge';
            coverTag.textContent = '★ COVER';
            card.appendChild(coverTag);
        }

        const actions = document.createElement('div');
        actions.className = 'prod-attached-actions';

        if (idx > 0) {
            const btnSetCover = document.createElement('button');
            btnSetCover.type = 'button';
            btnSetCover.className = 'btn-set-cover';
            btnSetCover.textContent = 'Set Cover';
            btnSetCover.title = 'Make this photo the primary cover image on the storefront';
            btnSetCover.addEventListener('click', () => {
                const targetImg = currentModalImages.splice(idx, 1)[0];
                currentModalImages.unshift(targetImg);
                renderModalAttachedImages();
            });
            actions.appendChild(btnSetCover);
        }

        const btnRemove = document.createElement('button');
        btnRemove.type = 'button';
        btnRemove.className = 'btn-remove-photo';
        btnRemove.textContent = '✕';
        btnRemove.title = 'Remove Photo';
        btnRemove.addEventListener('click', () => {
            if (currentModalImages.length <= 1) {
                if (validationMsg) {
                    validationMsg.textContent = '⚠️ Product must have at least 1 picture. Add another before removing this.';
                    validationMsg.style.display = 'block';
                }
                showAdminToast('⚠️ At least 1 product photo is required.', 'warning');
                return;
            }
            currentModalImages.splice(idx, 1);
            if (validationMsg) validationMsg.style.display = 'none';
            renderModalAttachedImages();
        });
        actions.appendChild(btnRemove);

        card.appendChild(actions);
        frag.appendChild(card);
    });

    grid.replaceChildren(frag);
}

function initProductImageAttachmentHandlers() {
    if (imgAttachmentHandlersBound) return;
    imgAttachmentHandlersBound = true;

    const dropzone = document.getElementById('prod-images-dropzone');
    const fileInput = document.getElementById('prod-file-input');
    const btnToggleUrl = document.getElementById('btn-toggle-img-url');
    const urlBox = document.getElementById('prod-img-url-box');
    const btnAddUrl = document.getElementById('btn-add-img-url');
    const manualUrlInput = document.getElementById('prod-manual-img-url');
    const validationMsg = document.getElementById('prod-images-validation-msg');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer && e.dataTransfer.files) {
                handleUploadedFiles(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleUploadedFiles(e.target.files);
                fileInput.value = '';
            }
        });
    }

    if (btnToggleUrl && urlBox) {
        btnToggleUrl.addEventListener('click', () => {
            urlBox.style.display = (urlBox.style.display === 'none' || !urlBox.style.display) ? 'block' : 'none';
        });
    }

    if (btnAddUrl && manualUrlInput) {
        btnAddUrl.addEventListener('click', () => {
            const raw = manualUrlInput.value.trim();
            if (!raw) return;
            if (!isValidImageUrl(raw)) {
                showAdminToast('⚠️ Invalid image URL. Must start with http://, https://, assets/, or data:image/', 'error');
                return;
            }
            if (currentModalImages.length >= 5) {
                showAdminToast('⚠️ Maximum 5 pictures allowed per product.', 'warning');
                return;
            }
            currentModalImages.push(raw);
            manualUrlInput.value = '';
            if (validationMsg) validationMsg.style.display = 'none';
            renderModalAttachedImages();
            showAdminToast('📸 Photo added from URL!', 'success');
        });
    }

    // Preset chips
    document.querySelectorAll('.btn-preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const url = chip.getAttribute('data-url');
            if (!url || !isValidImageUrl(url)) return;
            if (currentModalImages.length >= 5) {
                showAdminToast('⚠️ Maximum 5 pictures allowed per product.', 'warning');
                return;
            }
            currentModalImages.push(url);
            if (validationMsg) validationMsg.style.display = 'none';
            renderModalAttachedImages();
            showAdminToast(`📸 Added preset: ${chip.textContent.trim()}`, 'success');
        });
    });
}

function handleUploadedFiles(fileList) {
    const files = Array.from(fileList);
    const validationMsg = document.getElementById('prod-images-validation-msg');

    if (currentModalImages.length >= 5) {
        showAdminToast('⚠️ Maximum 5 pictures already reached. Remove one first.', 'warning');
        return;
    }

    const availableSlots = 5 - currentModalImages.length;
    const toProcess = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
        showAdminToast(`ℹ️ Only ${availableSlots} more photo(s) can be added (Maximum 5 photos per product).`, 'info');
    }

    toProcess.forEach(file => {
        // MIME type validation
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showAdminToast(`⚠️ File "${file.name}" is not a supported image. Use PNG, JPG, or WebP.`, 'error');
            return;
        }

        // Max raw size 5MB before canvas compression
        if (file.size > 5 * 1024 * 1024) {
            showAdminToast(`⚠️ File "${file.name}" exceeds 5MB limit. Please choose a smaller file.`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const rawDataUrl = e.target.result;
            compressAndAttachImage(rawDataUrl, file.name);
        };
        reader.readAsDataURL(file);
    });
}

function compressAndAttachImage(dataUrl, fileName) {
    const img = new Image();
    img.onload = () => {
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
            if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized WebP (fallback to JPEG)
        let optimizedDataUrl = canvas.toDataURL('image/webp', 0.85);
        if (!optimizedDataUrl.startsWith('data:image/webp')) {
            optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        if (currentModalImages.length < 5) {
            currentModalImages.push(optimizedDataUrl);
            renderModalAttachedImages();
            const validationMsg = document.getElementById('prod-images-validation-msg');
            if (validationMsg) validationMsg.style.display = 'none';
            showAdminToast(`📸 Photo "${fileName}" attached and optimized!`, 'success');
        }
    };
    img.onerror = () => {
        showAdminToast(`⚠️ Failed to load or decode "${fileName}". Please ensure it is a valid, uncorrupted image.`, 'error');
    };
    img.src = dataUrl;
}

async function handleProductFormSubmit(e) {
    e.preventDefault();

    const validationMsg = document.getElementById('prod-images-validation-msg');

    // STRICT VALIDATION: Minimum 1 picture, Maximum 5 pictures
    if (!currentModalImages || currentModalImages.length < 1) {
        if (validationMsg) {
            validationMsg.textContent = '⚠️ Validation Error: You must attach at least 1 product picture (Maximum 5).';
            validationMsg.style.display = 'block';
        }
        showAdminToast('⚠️ Please attach at least 1 product picture (Maximum 5).', 'error');
        return;
    }

    if (currentModalImages.length > 5) {
        if (validationMsg) {
            validationMsg.textContent = '⚠️ Validation Error: A maximum of 5 pictures can be attached per product.';
            validationMsg.style.display = 'block';
        }
        showAdminToast('⚠️ Maximum 5 pictures allowed per product.', 'error');
        return;
    }

    const prodId = document.getElementById('prod-field-id').value.trim();
    const name = document.getElementById('prod-field-name').value.trim();
    const hindiName = document.getElementById('prod-field-hindi').value.trim();
    const category = document.getElementById('prod-field-category').value;
    const sku = document.getElementById('prod-field-sku').value.trim();
    const price = Number(document.getElementById('prod-field-price').value);
    const mrp = Number(document.getElementById('prod-field-mrp').value);
    const stock = Number(document.getElementById('prod-field-stock').value);
    const badge = document.getElementById('prod-field-badge').value.trim();
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
        images: currentModalImages.slice(0, 5),
        img: currentModalImages[0],
        image: currentModalImages[0],
        desc,
        description: desc,
        available,
        updatedAt: new Date().toISOString()
    };

    try {
        let savedProd = null;
        if (typeof adminDataAdapter !== 'undefined') {
            savedProd = await adminDataAdapter.saveProduct({ ...payload, id: prodId || undefined });
        }

        // Firestore live sync if active
        if (window.db) {
            try {
                const targetId = prodId || (savedProd ? savedProd.id : ('prod_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Date.now().toString().slice(-4)));
                const prodRef = doc(window.db, 'products', targetId);
                await setDoc(prodRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
                console.log(`[Firestore] Product ${targetId} synchronized with ${payload.images.length} photos.`);
            } catch (fsErr) {
                console.warn("[Firestore] Sync notice (local adapter active):", fsErr.message);
            }
        }

        showAdminToast(`✅ Product "${name}" saved with ${payload.images.length} photo(s) — storefront synced in real time!`, 'success');
        closeProductModal();
        renderProductsView();
    } catch (err) {
        console.error("Failed to save product:", err);
        showAdminToast("Error saving product: " + err.message, 'error');
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
        const emptyText = document.createTextNode('No offline POS orders found.');
        const br = document.createElement('br');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-primary';
        btn.style.cssText = 'margin-top:10px;padding:6px 14px;font-size:0.8rem;';
        btn.textContent = '➕ Record First POS Order';
        btn.addEventListener('click', openOfflineOrderModal);
        td.replaceChildren(emptyText, br, btn);
        tr.appendChild(td);
        tbody.replaceChildren(tr);
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


// ═════════════════════════════════════════════════════════════════════════════
// 5. CUSTOMER REVIEWS & RATINGS TWO-TIER SUITE (ZERO innerHTML concatenation)
// ═════════════════════════════════════════════════════════════════════════════

let reviewsActiveTier = 'overall'; // 'overall' | 'product' | 'leaderboard'
let reviewsSelectedProduct = 'prod_aam_achar';
let reviewsVerifiedOnlyOverall = false;
let reviewsVerifiedOnlyProduct = false;
let reviewsLeaderboardSort = 'highest';
let currentReviewsFilter = 'all';
let currentReviewsQuery = '';
let reviewsEventsInitialized = false;

function renderReviewsManagement() {
    const allReviews = (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.getReviews === 'function')
        ? adminDataAdapter.getReviews()
        : (adminState.reviews || []);

    const featuredReviews = (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.getFeaturedReviews === 'function')
        ? adminDataAdapter.getFeaturedReviews()
        : allReviews.filter(r => r.featured === true);

    const featuredIds = new Set(featuredReviews.map(r => r.id));

    // Update KPI stats
    const statTotal = document.getElementById('stat-total-reviews');
    if (statTotal) statTotal.textContent = allReviews.length;

    const statFeatured = document.getElementById('stat-featured-reviews');
    if (statFeatured) statFeatured.textContent = featuredIds.size;

    const navBadge = document.getElementById('badge-featured-reviews');
    if (navBadge) navBadge.textContent = featuredIds.size;

    const verifiedCount = allReviews.filter(r => r.verified === true).length;
    const statVerified = document.getElementById('stat-verified-reviews');
    if (statVerified) statVerified.textContent = verifiedCount;

    const badgeVerifiedOverall = document.getElementById('badge-verified-overall-count');
    if (badgeVerifiedOverall) badgeVerifiedOverall.textContent = verifiedCount;

    const statAvg = document.getElementById('stat-avg-rating');
    if (statAvg) {
        if (allReviews.length > 0) {
            const sum = allReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
            statAvg.textContent = (sum / allReviews.length).toFixed(1) + ' ★';
        } else {
            statAvg.textContent = '5.0 ★';
        }
    }

    // Update Tier Counts
    const badgeTierOverall = document.getElementById('badge-tier-overall-cnt');
    if (badgeTierOverall) badgeTierOverall.textContent = allReviews.length;

    const prodSpecificReviews = (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.getReviewsByProduct === 'function')
        ? adminDataAdapter.getReviewsByProduct(reviewsSelectedProduct)
        : [];
    const badgeTierProduct = document.getElementById('badge-tier-product-cnt');
    if (badgeTierProduct) badgeTierProduct.textContent = prodSpecificReviews.length;

    // Render active tier panel
    if (reviewsActiveTier === 'overall') {
        renderTierOverallReviews(allReviews, featuredIds);
    } else if (reviewsActiveTier === 'product') {
        renderTierProductReviews();
    } else if (reviewsActiveTier === 'leaderboard') {
        renderTierLeaderboard();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1: OVERALL STORE REVIEWS (Common Reviews)
// ─────────────────────────────────────────────────────────────────────────────
function renderTierOverallReviews(allReviews, featuredIds) {
    const listContainer = document.getElementById('reviews-list-container');
    if (!listContainer) return;

    let filtered = allReviews.filter(r => {
        const isFeat = featuredIds.has(r.id) || r.featured === true;
        if (currentReviewsFilter === 'featured' && !isFeat) return false;
        if (currentReviewsFilter === '5star' && Number(r.rating) !== 5) return false;
        if (currentReviewsFilter === 'unfeatured' && isFeat) return false;

        if (reviewsVerifiedOnlyOverall && r.verified !== true) return false;

        if (currentReviewsQuery) {
            const q = currentReviewsQuery.toLowerCase();
            const author = (r.customerName || r.author || '').toLowerCase();
            const city = (r.city || '').toLowerCase();
            const prod = (r.productName || '').toLowerCase();
            const title = (r.title || '').toLowerCase();
            const text = (r.text || r.comment || '').toLowerCase();
            if (!author.includes(q) && !city.includes(q) && !prod.includes(q) && !title.includes(q) && !text.includes(q)) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'grid-column: 1/-1; padding: 36px 20px; text-align: center; background: #FFFFFF; border-radius: 12px; border: 1px dashed #D4A017;';
        const p1 = document.createElement('p');
        p1.style.cssText = 'font-size: 1.1rem; color: #7A1C1C; font-weight: 700; margin-bottom: 6px;';
        p1.textContent = 'No reviews found matching active filter.';
        const p2 = document.createElement('p');
        p2.style.cssText = 'font-size: 0.85rem; color: #6B625B;';
        p2.textContent = "Try choosing 'All Reviews' or toggle off the verified purchases filter.";
        emptyDiv.appendChild(p1);
        emptyDiv.appendChild(p2);
        listContainer.replaceChildren(emptyDiv);
        return;
    }

    renderReviewsCardsInto(listContainer, filtered, featuredIds);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2: PRODUCT-SPECIFIC REVIEWS & PRODUCT LOVE SCORECARD
// ─────────────────────────────────────────────────────────────────────────────
function renderTierProductReviews() {
    const selectProduct = document.getElementById('select-reviews-product');
    const chipsContainer = document.getElementById('product-quick-select-chips');
    const bannerContainer = document.getElementById('product-love-banner-container');
    const listContainer = document.getElementById('product-specific-reviews-container');

    const products = (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.getProducts === 'function')
        ? adminDataAdapter.getProducts()
        : [];

    if (products.length === 0) return;

    // Ensure valid selected product
    if (!products.some(p => p.id === reviewsSelectedProduct)) {
        reviewsSelectedProduct = products[0].id;
    }

    // 1. Populate Dropdown Options
    if (selectProduct && selectProduct.children.length !== products.length) {
        const frag = document.createDocumentFragment();
        products.forEach(p => {
            const metrics = adminDataAdapter.getProductReviewMetrics(p.id);
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${metrics.totalReviews} reviews · ${metrics.avgRating} ★)`;
            frag.appendChild(opt);
        });
        selectProduct.replaceChildren(frag);
    }
    if (selectProduct) {
        selectProduct.value = reviewsSelectedProduct;
    }

    // 2. Populate Quick Pick Chips (first 5 popular products)
    if (chipsContainer && chipsContainer.querySelectorAll('.btn-preset-chip').length === 0) {
        const frag = document.createDocumentFragment();
        const popularProds = products.slice(0, 6);
        popularProds.forEach(p => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'btn-preset-chip' + (p.id === reviewsSelectedProduct ? ' active' : '');
            chip.textContent = p.name.split(' ')[0] + ' ' + (p.name.split(' ')[1] || '');
            chip.addEventListener('click', () => {
                reviewsSelectedProduct = p.id;
                renderReviewsManagement();
            });
            frag.appendChild(chip);
        });
        chipsContainer.appendChild(frag);
    }

    // Update active class on quick chips
    if (chipsContainer) {
        chipsContainer.querySelectorAll('.btn-preset-chip').forEach(c => {
            const matchingProd = products.find(p => c.textContent.trim().startsWith(p.name.split(' ')[0]));
            if (matchingProd && matchingProd.id === reviewsSelectedProduct) {
                c.style.background = '#7A1C1C';
                c.style.color = '#FFF';
                c.style.borderColor = '#7A1C1C';
            } else {
                c.style.background = '#FFFFFF';
                c.style.color = '#4A3B32';
                c.style.borderColor = '#D4C7B5';
            }
        });
    }

    // 3. Render Product Love Scorecard Banner
    const currentProd = products.find(p => p.id === reviewsSelectedProduct) || products[0];
    const metrics = adminDataAdapter.getProductReviewMetrics(currentProd.id);

    if (bannerContainer) {
        const prodImgSrc = (Array.isArray(currentProd.images) && currentProd.images[0]) || currentProd.image || currentProd.img || 'assets/aam-ka-achar.png';
        const starsText = '★'.repeat(Math.round(metrics.avgRating)) + '☆'.repeat(5 - Math.round(metrics.avgRating));

        const banner = document.createElement('div');
        banner.className = 'product-love-banner';

        const img = document.createElement('img');
        img.src = prodImgSrc;
        img.alt = currentProd.name || 'Product Photo';
        img.className = 'product-love-img';
        img.addEventListener('error', () => { img.src = 'assets/aam-ka-achar.png'; });
        banner.appendChild(img);

        const info = document.createElement('div');
        info.className = 'product-love-info';

        const h2 = document.createElement('h2');
        h2.textContent = currentProd.name || '';
        info.appendChild(h2);

        const hindiDiv = document.createElement('div');
        hindiDiv.className = 'hindi-name';
        hindiDiv.textContent = (currentProd.hindiName || currentProd.nameHindi || '') + ' • ';
        const catSpan = document.createElement('span');
        catSpan.style.cssText = 'text-transform:capitalize;color:#7A1C1C;font-weight:700;';
        catSpan.textContent = currentProd.category || currentProd.cat || 'Artisanal';
        hindiDiv.appendChild(catSpan);
        info.appendChild(hindiDiv);

        const badgesRow = document.createElement('div');
        badgesRow.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:6px;';

        const lovePill = document.createElement('span');
        lovePill.className = 'love-meter-pill';
        lovePill.textContent = `❤️ ${metrics.loveScore}% Customer Love Score`;

        const reviewsNote = document.createElement('span');
        reviewsNote.style.cssText = 'font-size:0.82rem;color:#6B625B;font-weight:700;';
        reviewsNote.textContent = `📊 Based on ${metrics.totalReviews} authentic customer reviews`;

        badgesRow.appendChild(lovePill);
        badgesRow.appendChild(reviewsNote);
        info.appendChild(badgesRow);
        banner.appendChild(info);

        const scoreCol = document.createElement('div');
        scoreCol.className = 'product-love-score';

        const bigStars = document.createElement('div');
        bigStars.className = 'big-stars';
        bigStars.textContent = `${metrics.avgRating} `;
        const goldStar = document.createElement('span');
        goldStar.style.cssText = 'font-size:1.4rem;color:#D4A017;';
        goldStar.textContent = '★';
        bigStars.appendChild(goldStar);
        scoreCol.appendChild(bigStars);

        const starsDiv = document.createElement('div');
        starsDiv.style.cssText = 'font-size:0.82rem;color:#856404;font-weight:700;margin-bottom:4px;';
        starsDiv.textContent = starsText;
        scoreCol.appendChild(starsDiv);

        const verifiedBadge = document.createElement('div');
        verifiedBadge.className = 'verified-badge-cnt';
        verifiedBadge.textContent = `✔ ${metrics.verifiedReviews} Verified Purchases`;
        scoreCol.appendChild(verifiedBadge);

        banner.appendChild(scoreCol);
        bannerContainer.replaceChildren(banner);
    }

    // 4. Render Product Specific Reviews List
    if (listContainer) {
        let prodReviews = adminDataAdapter.getReviewsByProduct(reviewsSelectedProduct);
        if (reviewsVerifiedOnlyProduct) {
            prodReviews = prodReviews.filter(r => r.verified === true);
        }

        const featuredReviews = adminDataAdapter.getFeaturedReviews();
        const featuredIds = new Set(featuredReviews.map(r => r.id));

        if (prodReviews.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.cssText = 'grid-column: 1/-1; padding: 36px 20px; text-align: center; background: #FFFFFF; border-radius: 12px; border: 1px dashed #D4A017;';
            const p1 = document.createElement('p');
            p1.style.cssText = 'font-size: 1.1rem; color: #7A1C1C; font-weight: 700; margin-bottom: 6px;';
            p1.textContent = `No reviews yet for ${currentProd.name}.`;
            const p2 = document.createElement('p');
            p2.style.cssText = 'font-size: 0.85rem; color: #6B625B;';
            p2.textContent = 'Click "+ Add New Testimonial" above to add customer feedback for this item.';
            emptyDiv.appendChild(p1);
            emptyDiv.appendChild(p2);
            listContainer.replaceChildren(emptyDiv);
            return;
        }

        renderReviewsCardsInto(listContainer, prodReviews, featuredIds);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3: PRODUCT PERFORMANCE LEADERBOARD (Top vs Lower Rated)
// ─────────────────────────────────────────────────────────────────────────────
function renderTierLeaderboard() {
    const topListEl = document.getElementById('leaderboard-top-list');
    const lowListEl = document.getElementById('leaderboard-low-list');

    if (!topListEl || !lowListEl) return;

    const data = adminDataAdapter.getProductPerformanceLeaderboard(reviewsLeaderboardSort);

    // Render Top Performers
    if (data.topPerformers.length === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'color:#888;padding:12px;text-align:center;';
        p.textContent = 'No items currently above 4.8★';
        topListEl.replaceChildren(p);
    } else {
        const frag = document.createDocumentFragment();
        data.topPerformers.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-item-row';

            const leftDiv = document.createElement('div');
            leftDiv.style.cssText = 'display:flex;align-items:center;gap:10px;flex:1;';

            const rankCircle = document.createElement('div');
            rankCircle.className = 'rank-circle rank-top';
            rankCircle.textContent = `#${idx + 1}`;
            leftDiv.appendChild(rankCircle);

            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name || 'Product';
            img.style.cssText = 'width:42px;height:42px;object-fit:cover;border-radius:8px;border:1px solid #D4A017;';
            img.addEventListener('error', () => { img.src = 'assets/aam-ka-achar.png'; });
            leftDiv.appendChild(img);

            const nameWrap = document.createElement('div');
            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-weight:800;font-size:0.9rem;color:#2A211D;';
            nameEl.textContent = item.name;

            const subEl = document.createElement('div');
            subEl.style.cssText = 'font-size:0.75rem;color:#8C6D46;';
            subEl.textContent = (item.hindiName || '') + ' • ';
            const loveSpan = document.createElement('span');
            loveSpan.style.cssText = 'color:#059669;font-weight:700;';
            loveSpan.textContent = `❤️ ${item.loveScore}% Love`;
            subEl.appendChild(loveSpan);

            nameWrap.appendChild(nameEl);
            nameWrap.appendChild(subEl);
            leftDiv.appendChild(nameWrap);
            row.appendChild(leftDiv);

            const rightDiv = document.createElement('div');
            rightDiv.style.cssText = 'text-align:right;display:flex;align-items:center;gap:12px;';

            const ratingCol = document.createElement('div');
            const ratingVal = document.createElement('div');
            ratingVal.style.cssText = 'font-weight:900;font-size:1.05rem;color:#065F46;';
            ratingVal.textContent = `${item.avgRating} ★`;
            const countVal = document.createElement('div');
            countVal.style.cssText = 'font-size:0.74rem;color:#6B625B;';
            countVal.textContent = `${item.totalReviews} reviews`;
            ratingCol.appendChild(ratingVal);
            ratingCol.appendChild(countVal);
            rightDiv.appendChild(ratingCol);

            const inspectBtn = document.createElement('button');
            inspectBtn.type = 'button';
            inspectBtn.className = 'btn-inspect-prod-rev';
            inspectBtn.setAttribute('data-product-id', item.id);
            inspectBtn.style.cssText = 'background:#FAF5EB;border:1px solid #D4A017;color:#7A1C1C;font-size:0.74rem;font-weight:800;padding:5px 9px;border-radius:6px;cursor:pointer;';
            inspectBtn.textContent = 'Inspect →';
            inspectBtn.addEventListener('click', () => {
                switchToProductReviewsTier(item.id);
            });
            rightDiv.appendChild(inspectBtn);
            row.appendChild(rightDiv);

            frag.appendChild(row);
        });
        topListEl.replaceChildren(frag);
    }

    // Render Lower Rated / Needs Attention
    if (data.lowerRated.length === 0) {
        const p = document.createElement('p');
        p.style.cssText = 'color:#065F46;font-weight:700;padding:12px;text-align:center;';
        p.textContent = '🎉 Fantastic! All catalog items are performing exceptionally with 4.8★+ ratings!';
        lowListEl.replaceChildren(p);
    } else {
        const frag = document.createDocumentFragment();
        data.lowerRated.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-item-row';

            const leftDiv = document.createElement('div');
            leftDiv.style.cssText = 'display:flex;align-items:center;gap:10px;flex:1;';

            const rankCircle = document.createElement('div');
            rankCircle.className = 'rank-circle rank-low';
            rankCircle.textContent = `#${idx + 1}`;
            leftDiv.appendChild(rankCircle);

            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name || 'Product';
            img.style.cssText = 'width:42px;height:42px;object-fit:cover;border-radius:8px;border:1px solid #F87171;';
            img.addEventListener('error', () => { img.src = 'assets/aam-ka-achar.png'; });
            leftDiv.appendChild(img);

            const nameWrap = document.createElement('div');
            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-weight:800;font-size:0.9rem;color:#2A211D;';
            nameEl.textContent = item.name;

            const subEl = document.createElement('div');
            subEl.style.cssText = 'font-size:0.75rem;color:#991B1B;';
            subEl.textContent = '⚠️ Customer feedback: check spice/salt balance';

            nameWrap.appendChild(nameEl);
            nameWrap.appendChild(subEl);
            leftDiv.appendChild(nameWrap);
            row.appendChild(leftDiv);

            const rightDiv = document.createElement('div');
            rightDiv.style.cssText = 'text-align:right;display:flex;align-items:center;gap:12px;';

            const ratingCol = document.createElement('div');
            const ratingVal = document.createElement('div');
            ratingVal.style.cssText = 'font-weight:900;font-size:1.05rem;color:#B45309;';
            ratingVal.textContent = `${item.avgRating} ★`;
            const countVal = document.createElement('div');
            countVal.style.cssText = 'font-size:0.74rem;color:#6B625B;';
            countVal.textContent = `${item.totalReviews} reviews`;
            ratingCol.appendChild(ratingVal);
            ratingCol.appendChild(countVal);
            rightDiv.appendChild(ratingCol);

            const inspectBtn = document.createElement('button');
            inspectBtn.type = 'button';
            inspectBtn.className = 'btn-inspect-prod-rev';
            inspectBtn.setAttribute('data-product-id', item.id);
            inspectBtn.style.cssText = 'background:#FFF1F2;border:1px solid #FCA5A5;color:#991B1B;font-size:0.74rem;font-weight:800;padding:5px 9px;border-radius:6px;cursor:pointer;';
            inspectBtn.textContent = 'Inspect →';
            inspectBtn.addEventListener('click', () => {
                switchToProductReviewsTier(item.id);
            });
            rightDiv.appendChild(inspectBtn);
            row.appendChild(rightDiv);

            frag.appendChild(row);
        });
        lowListEl.replaceChildren(frag);
    }
}

function switchToProductReviewsTier(productId) {
    reviewsSelectedProduct = productId;
    reviewsActiveTier = 'product';

    document.querySelectorAll('.tier-tab-btn').forEach(b => b.classList.remove('active'));
    const btnProdTier = document.getElementById('btn-tier-product');
    if (btnProdTier) btnProdTier.classList.add('active');

    const panelOverall = document.getElementById('reviews-tier-overall-panel');
    const panelProduct = document.getElementById('reviews-tier-product-panel');
    const panelLeaderboard = document.getElementById('reviews-tier-leaderboard-panel');

    if (panelOverall) panelOverall.style.display = 'none';
    if (panelProduct) panelProduct.style.display = 'block';
    if (panelLeaderboard) panelLeaderboard.style.display = 'none';

    renderReviewsManagement();
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE REVIEW CARD BUILDER WITH REAL-TIME HOMEPAGE CURATION TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function renderReviewsCardsInto(container, reviewsList, featuredIds) {
    const frag = document.createDocumentFragment();

    reviewsList.forEach(r => {
        const isFeat = featuredIds.has(r.id) || r.featured === true;
        const card = document.createElement('article');
        card.className = 'rev-admin-card';
        card.style.cssText = `
            background: #FFFFFF;
            border: 1.5px solid ${isFeat ? 'var(--gold, #D4A017)' : 'var(--border, #E8DFD3)'};
            border-radius: 14px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: ${isFeat ? '0 4px 14px rgba(212, 160, 23, 0.14)' : '0 2px 6px rgba(0,0,0,0.03)'};
            transition: all 0.2s ease;
        `;

        const stars = '★'.repeat(Math.min(5, Math.max(1, Number(r.rating) || 5)));
        const initials = (r.customerName || r.author || 'SS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

        const topRow = document.createElement('div');
        const userHeader = document.createElement('div');
        userHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';

        const userLeft = document.createElement('div');
        userLeft.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const avatar = document.createElement('div');
        avatar.style.cssText = `width: 38px; height: 38px; border-radius: 50%; background: ${isFeat ? '#FAF5EB' : '#F4EFE6'}; color: #7A1C1C; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; border: 1.5px solid ${isFeat ? '#D4A017' : '#D4C7B5'};`;
        avatar.textContent = initials;
        userLeft.appendChild(avatar);

        const userInfo = document.createElement('div');
        const nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-weight: 800; font-size: 0.92rem; color: #2A211D;';
        nameEl.textContent = r.customerName || r.author || 'Anonymous';
        userInfo.appendChild(nameEl);

        const cityEl = document.createElement('div');
        cityEl.style.cssText = 'font-size: 0.74rem; color: #6B625B;';
        cityEl.textContent = `📍 ${r.city || 'India'} `;
        if (r.verified) {
            const verSpan = document.createElement('span');
            verSpan.style.cssText = 'color:#2C5E3B;font-weight:700;';
            verSpan.textContent = '• ✓ Verified Buyer';
            cityEl.appendChild(verSpan);
        }
        userInfo.appendChild(cityEl);
        userLeft.appendChild(userInfo);
        userHeader.appendChild(userLeft);

        const starsSpan = document.createElement('span');
        starsSpan.style.cssText = 'color: #D4A017; font-size: 1.15rem; letter-spacing: 1px;';
        starsSpan.textContent = stars;
        userHeader.appendChild(starsSpan);
        topRow.appendChild(userHeader);

        const metaRow = document.createElement('div');
        metaRow.style.cssText = 'margin-bottom: 10px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;';

        const jumpBtn = document.createElement('button');
        jumpBtn.type = 'button';
        jumpBtn.className = 'btn-jump-product-rev';
        jumpBtn.setAttribute('data-product-id', r.productId || '');
        jumpBtn.style.cssText = 'display: inline-block; background: #FAF5EB; color: #7A1C1C; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(212,160,23,0.3); cursor:pointer;';
        jumpBtn.textContent = `📦 ${r.productName || 'Artisanal Delicacy'}`;
        jumpBtn.addEventListener('click', () => {
            if (r.productId) switchToProductReviewsTier(r.productId);
        });
        metaRow.appendChild(jumpBtn);

        if (r.date) {
            const dateSpan = document.createElement('span');
            dateSpan.style.cssText = 'font-size: 0.72rem; color: #8C827A;';
            dateSpan.textContent = r.date;
            metaRow.appendChild(dateSpan);
        }
        topRow.appendChild(metaRow);

        if (r.title) {
            const titleEl = document.createElement('div');
            titleEl.style.cssText = 'font-weight: 700; font-size: 0.95rem; color: #7A1C1C; margin-bottom: 4px;';
            titleEl.textContent = `"${r.title}"`;
            topRow.appendChild(titleEl);
        }

        const textEl = document.createElement('p');
        textEl.style.cssText = 'font-size: 0.86rem; color: #4A3E39; line-height: 1.5; margin-bottom: 16px; font-style: italic;';
        textEl.textContent = `"${r.text || r.comment || ''}"`;
        topRow.appendChild(textEl);
        card.appendChild(topRow);

        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #F4EFE6; padding-top: 12px; margin-top: auto;';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = `rev-toggle-btn ${isFeat ? 'active' : ''}`;
        toggleBtn.setAttribute('data-review-id', r.id);
        toggleBtn.style.cssText = `display: inline-flex; align-items: center; gap: 8px; background: ${isFeat ? 'linear-gradient(135deg, #FAF5EB, #FFF8E7)' : '#F4EFE6'}; color: ${isFeat ? '#856404' : '#6B625B'}; border: 1.5px solid ${isFeat ? '#D4A017' : '#D4C7B5'}; padding: 6px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease;`;

        const toggleSpan = document.createElement('span');
        toggleSpan.textContent = isFeat ? '⭐ Live on Homepage' : 'Hidden from Homepage';
        toggleBtn.appendChild(toggleSpan);
        bottomRow.appendChild(toggleBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-delete-review';
        deleteBtn.setAttribute('data-review-id', r.id);
        deleteBtn.setAttribute('aria-label', 'Delete Review');
        deleteBtn.style.cssText = 'background: none; border: none; color: #C0392B; cursor: pointer; font-size: 0.82rem; padding: 4px 6px;';
        deleteBtn.textContent = '🗑️';
        bottomRow.appendChild(deleteBtn);

        card.appendChild(bottomRow);

        frag.appendChild(card);
    });

    container.replaceChildren(frag);

    // Bind toggles
    container.querySelectorAll('.rev-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const revId = btn.getAttribute('data-review-id');
            if (revId && typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.toggleFeaturedReview === 'function') {
                const res = adminDataAdapter.toggleFeaturedReview(revId);
                showAdminToast(`⭐ Review ${res.review.featured ? 'added to' : 'removed from'} Homepage marquee!`, 'success');
                renderReviewsManagement();
            }
        });
    });

    // Bind deletes
    container.querySelectorAll('.btn-delete-review').forEach(btn => {
        btn.addEventListener('click', () => {
            const revId = btn.getAttribute('data-review-id');
            if (revId && confirm('Delete this review permanently?')) {
                adminDataAdapter.deleteReview(revId);
                showAdminToast('Review deleted', 'info');
                renderReviewsManagement();
            }
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS & RATINGS EVENT BINDINGS
// ─────────────────────────────────────────────────────────────────────────────
function initReviewsManagementEvents() {
    if (reviewsEventsInitialized) return;
    reviewsEventsInitialized = true;

    // 1. Two-Tier Navigation Tabs
    const btnOverall = document.getElementById('btn-tier-overall');
    const btnProduct = document.getElementById('btn-tier-product');
    const btnLeaderboard = document.getElementById('btn-tier-leaderboard');

    const panelOverall = document.getElementById('reviews-tier-overall-panel');
    const panelProduct = document.getElementById('reviews-tier-product-panel');
    const panelLeaderboard = document.getElementById('reviews-tier-leaderboard-panel');

    const setTier = (tier) => {
        reviewsActiveTier = tier;
        [btnOverall, btnProduct, btnLeaderboard].forEach(b => b && b.classList.remove('active'));
        if (panelOverall) panelOverall.style.display = 'none';
        if (panelProduct) panelProduct.style.display = 'none';
        if (panelLeaderboard) panelLeaderboard.style.display = 'none';

        if (tier === 'overall') {
            if (btnOverall) btnOverall.classList.add('active');
            if (panelOverall) panelOverall.style.display = 'block';
        } else if (tier === 'product') {
            if (btnProduct) btnProduct.classList.add('active');
            if (panelProduct) panelProduct.style.display = 'block';
        } else if (tier === 'leaderboard') {
            if (btnLeaderboard) btnLeaderboard.classList.add('active');
            if (panelLeaderboard) panelLeaderboard.style.display = 'block';
        }
        renderReviewsManagement();
    };

    if (btnOverall) btnOverall.addEventListener('click', () => setTier('overall'));
    if (btnProduct) btnProduct.addEventListener('click', () => setTier('product'));
    if (btnLeaderboard) btnLeaderboard.addEventListener('click', () => setTier('leaderboard'));

    // 2. Product Selector Dropdown
    const selectProd = document.getElementById('select-reviews-product');
    if (selectProd) {
        selectProd.addEventListener('change', (e) => {
            reviewsSelectedProduct = e.target.value;
            renderReviewsManagement();
        });
    }

    // 3. Verified Purchases Filter Toggles
    const btnVerifiedOverall = document.getElementById('btn-filter-verified-overall');
    if (btnVerifiedOverall) {
        btnVerifiedOverall.addEventListener('click', () => {
            reviewsVerifiedOnlyOverall = !reviewsVerifiedOnlyOverall;
            btnVerifiedOverall.classList.toggle('active', reviewsVerifiedOnlyOverall);
            renderReviewsManagement();
        });
    }

    const btnVerifiedProduct = document.getElementById('btn-filter-verified-product');
    if (btnVerifiedProduct) {
        btnVerifiedProduct.addEventListener('click', () => {
            reviewsVerifiedOnlyProduct = !reviewsVerifiedOnlyProduct;
            btnVerifiedProduct.classList.toggle('active', reviewsVerifiedOnlyProduct);
            renderReviewsManagement();
        });
    }

    // 4. Leaderboard Sort Dropdown
    const selectSort = document.getElementById('select-leaderboard-sort');
    if (selectSort) {
        selectSort.addEventListener('change', (e) => {
            reviewsLeaderboardSort = e.target.value;
            renderTierLeaderboard();
        });
    }

    // 5. Publish to Homepage Button
    const btnPublish = document.getElementById('btn-publish-reviews');
    if (btnPublish) {
        btnPublish.addEventListener('click', () => {
            if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.publishFeaturedReviews === 'function') {
                const list = adminDataAdapter.publishFeaturedReviews();
                showAdminToast(`🚀 Published ${list.length} curated reviews to Homepage!`, 'success');
            } else {
                showAdminToast('🚀 Reviews saved!', 'success');
            }
        });
    }

    // 6. Sub-Filter tabs in Overall panel
    const tabs = document.querySelectorAll('#reviews-filter-tabs .filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentReviewsFilter = tab.getAttribute('data-filter') || 'all';
            renderReviewsManagement();
        });
    });

    // 7. Search input
    const searchInput = document.getElementById('input-search-reviews');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentReviewsQuery = (e.target.value || '').trim();
            renderReviewsManagement();
        });
    }

}

// Subscribe to reviews updates
if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.subscribe === 'function') {
    adminDataAdapter.subscribe('reviews', () => {
        if (typeof adminState !== 'undefined' && adminState.activeView === 'view-reviews') {
            renderReviewsManagement();
        }
    });
}

// Auto-run initReviewsManagementEvents when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewsManagementEvents);
} else {
    initReviewsManagementEvents();
}


// ═════════════════════════════════════════════════════════════════════════════
// 8. NEWSLETTER SUBSCRIBERS & EMAIL CAMPAIGN DISPATCH SUITE
// ═════════════════════════════════════════════════════════════════════════════

let subscribersEventsInitialized = false;

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function updateSubscribersBadge() {
    const badge = document.getElementById('badge-subscribers-count');
    if (!badge) return;
    try {
        const subs = adminDataAdapter.getSubscribers();
        const activeCount = subs.filter(s => s.status !== 'unsubscribed').length;
        badge.textContent = activeCount;
    } catch (e) {
        badge.textContent = '0';
    }
}

export function copyTextToClipboard(text, onSuccess) {
    if (!text) {
        showAdminToast('No emails to copy.', 'warning');
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            if (onSuccess) onSuccess();
        }).catch(() => {
            fallbackCopyText(text, onSuccess);
        });
    } else {
        fallbackCopyText(text, onSuccess);
    }
}

function fallbackCopyText(text, onSuccess) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        if (onSuccess) onSuccess();
    } catch (e) {
        showAdminToast('Could not copy to clipboard. Please copy manually.', 'error');
    }
    document.body.removeChild(textarea);
}

export function updateSubscribersPreview(allSubs) {
    const preview = document.getElementById('subscribers-clipboard-preview');
    if (!preview) return;
    const subs = allSubs || adminDataAdapter.getSubscribers();
    const activeEmails = subs.filter(s => s.status !== 'unsubscribed').map(s => s.email);

    const format = adminState.subscribersFormat || 'comma';
    let delimiter = ', ';
    if (format === 'newline') delimiter = '\n';
    if (format === 'semi') delimiter = '; ';

    preview.value = activeEmails.join(delimiter);
}

export async function renderSubscribersView() {
    if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.syncLocalSubscribers === 'function') {
        try { await adminDataAdapter.syncLocalSubscribers(); } catch (e) {}
    }
    updateSubscribersBadge();
    const allSubs = adminDataAdapter.getSubscribers();
    const kpis = adminDataAdapter.getSubscribersKPIs();

    // Update KPI elements
    const statTotal = document.getElementById('stat-total-subscribers');
    const statActive = document.getElementById('stat-active-subscribers');
    const statMonth = document.getElementById('stat-month-subscribers');
    const countAll = document.getElementById('count-filter-all');
    const countActive = document.getElementById('count-filter-active');

    if (statTotal) statTotal.textContent = kpis.total;
    if (statActive) statActive.textContent = kpis.active;
    if (statMonth) statMonth.textContent = kpis.thisMonth;
    if (countAll) countAll.textContent = kpis.total;
    if (countActive) countActive.textContent = kpis.active;

    // Update formatted emails preview in Quick Campaign Toolkit
    updateSubscribersPreview(allSubs);

    // Filter subscribers according to tab and search query
    let filtered = allSubs.slice();
    const filter = adminState.subscribersFilter || 'all';
    if (filter === 'active') {
        filtered = filtered.filter(s => s.status !== 'unsubscribed');
    } else if (filter === 'recent') {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(s => new Date(s.createdAt || 0).getTime() >= sevenDaysAgo);
    }

    const query = (adminState.subscribersSearchQuery || '').trim().toLowerCase();
    if (query) {
        filtered = filtered.filter(s => (s.email || '').toLowerCase().includes(query) || (s.source || '').toLowerCase().includes(query));
    }

    // Render table rows
    const tbody = document.getElementById('subscribers-table-body');
    if (!tbody) return;

    tbody.replaceChildren();

    if (filtered.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.style.textAlign = 'center';
        td.style.padding = '30px 16px';
        td.style.color = '#7A6B5D';
        td.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                <span style="font-size:1.8rem;">📭</span>
                <strong style="font-size:0.95rem;">No subscribers found</strong>
                <span style="font-size:0.8rem;color:#998774;">${query ? 'Try adjusting your search query.' : 'New storefront footer subscribers will appear here automatically.'}</span>
            </div>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    filtered.forEach((sub, idx) => {
        const tr = document.createElement('tr');

        // # Index
        const tdIdx = document.createElement('td');
        tdIdx.style.color = '#8C7A68';
        tdIdx.style.fontWeight = '700';
        tdIdx.textContent = idx + 1;
        tr.appendChild(tdIdx);

        // Email with avatar
        const tdEmail = document.createElement('td');
        const initial = (sub.email ? sub.email.charAt(0).toUpperCase() : 'S');
        tdEmail.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:32px;height:32px;border-radius:50%;background:#E8F5E9;color:#2E7D32;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.85rem;border:1.5px solid #C8E6C9;flex-shrink:0;">
                    ${initial}
                </div>
                <div>
                    <div style="font-weight:800;color:var(--dark);font-size:0.88rem;">${escapeHtml(sub.email)}</div>
                    <div style="font-size:0.72rem;color:#8C7A68;">ID: ${escapeHtml(sub.id || 'N/A')}</div>
                </div>
            </div>
        `;
        tr.appendChild(tdEmail);

        // Source
        const tdSource = document.createElement('td');
        const isFooter = sub.source === 'storefront_footer';
        tdSource.innerHTML = `
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:700;padding:3px 9px;border-radius:12px;background:${isFooter ? '#E8F5E9' : '#FFF3E0'};color:${isFooter ? '#1D552C' : '#E65100'};border:1px solid ${isFooter ? '#A5D6A7' : '#FFE082'};	e;">
                ${isFooter ? '🌿 Storefront Footer' : '⚙️ ' + escapeHtml(sub.source || 'Manual')}
            </span>
        `;
        tr.appendChild(tdSource);

        // Date & Time
        const tdDate = document.createElement('td');
        const dateObj = new Date(sub.createdAt || 0);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Recently';
        tdDate.innerHTML = `<span style="font-size:0.82rem;color:#55483D;">${dateStr}</span>`;
        tr.appendChild(tdDate);

        // Status
        const tdStatus = document.createElement('td');
        const isActive = sub.status !== 'unsubscribed';
        tdStatus.innerHTML = `
            <span style="display:inline-flex;align-items:center;gap:5px;font-size:0.75rem;font-weight:800;padding:2px 8px;border-radius:10px;background:${isActive ? '#E8F5E9' : '#ECEFF1'};color:${isActive ? '#2E7D32' : '#607D8B'};	e;">
                ● ${isActive ? 'Active' : 'Unsubscribed'}
            </span>
        `;
        tr.appendChild(tdStatus);

        // Actions
        const tdActions = document.createElement('td');
        tdActions.style.textAlign = 'right';
        tdActions.style.whiteSpace = 'nowrap';

        // Copy single email button
        const btnCopy = document.createElement('button');
        btnCopy.type = 'button';
        btnCopy.className = 'btn-secondary';
        btnCopy.style.padding = '4px 9px';
        btnCopy.style.fontSize = '0.75rem';
        btnCopy.style.marginRight = '6px';
        btnCopy.title = 'Copy email address';
        btnCopy.innerHTML = '📋 Copy';
        btnCopy.addEventListener('click', () => {
            copyTextToClipboard(sub.email, () => {
                btnCopy.innerHTML = '✅ Copied!';
                btnCopy.style.background = '#E8F5E9';
                btnCopy.style.color = '#2E7D32';
                showAdminToast(`Copied ${sub.email} to clipboard!`, 'success');
                setTimeout(() => {
                    btnCopy.innerHTML = '📋 Copy';
                    btnCopy.style.background = '';
                    btnCopy.style.color = '';
                }, 2000);
            });
        });

        // Mailto button
        const aMail = document.createElement('a');
        aMail.href = `mailto:${encodeURIComponent(sub.email)}?subject=Special%20Offer%20from%20Satvik%20Swaad`;
        aMail.className = 'btn-secondary';
        aMail.style.padding = '4px 9px';
        aMail.style.fontSize = '0.75rem';
        aMail.style.marginRight = '6px';
        aMail.style.textDecoration = 'none';
        aMail.title = 'Send email';
        aMail.innerHTML = '✉️ Mail';

        // Delete button
        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn-secondary';
        btnDelete.style.padding = '4px 8px';
        btnDelete.style.fontSize = '0.75rem';
        btnDelete.style.color = '#DC2626';
        btnDelete.style.borderColor = '#FCA5A5';
        btnDelete.style.background = '#FFF5F5';
        btnDelete.title = 'Remove subscriber';
        btnDelete.innerHTML = '🗑️';
        btnDelete.addEventListener('click', () => {
            if (confirm(`Remove "${sub.email}" from newsletter subscribers?`)) {
                adminDataAdapter.deleteSubscriber(sub.id);
                showAdminToast(`Removed ${sub.email}`, 'info');
                renderSubscribersView();
            }
        });

        tdActions.appendChild(btnCopy);
        tdActions.appendChild(aMail);
        tdActions.appendChild(btnDelete);
        tr.appendChild(tdActions);

        tbody.appendChild(tr);
    });
}

export function initSubscribersManagementEvents() {
    if (subscribersEventsInitialized) return;
    subscribersEventsInitialized = true;

    // 1. Copy All Buttons
    const btnCopyAll = document.getElementById('btn-copy-all-subscribers');
    const btnCopyPreview = document.getElementById('btn-copy-preview-emails');

    const handleCopyAll = (btn) => {
        const preview = document.getElementById('subscribers-clipboard-preview');
        const text = preview ? preview.value : '';
        const activeCount = adminDataAdapter.getSubscribers().filter(s => s.status !== 'unsubscribed').length;
        if (!text || activeCount === 0) {
            showAdminToast('No active subscribers to copy.', 'warning');
            return;
        }
        copyTextToClipboard(text, () => {
            showAdminToast(`📋 Copied ${activeCount} subscriber email addresses to clipboard! Ready to paste into Gmail BCC.`, 'success');
            if (btn) {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '✅ Copied to Clipboard!';
                setTimeout(() => { btn.innerHTML = originalHtml; }, 2500);
            }
        });
    };

    if (btnCopyAll) btnCopyAll.addEventListener('click', () => handleCopyAll(btnCopyAll));
    if (btnCopyPreview) btnCopyPreview.addEventListener('click', () => handleCopyAll(btnCopyPreview));

    // 2. Format Switcher Tabs
    ['comma', 'newline', 'semi'].forEach(fmt => {
        const btn = document.getElementById('btn-format-' + fmt);
        if (btn) {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#view-subscribers button[data-format]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                adminState.subscribersFormat = fmt;
                updateSubscribersPreview();
            });
        }
    });

    // 3. Export CSV Button
    const btnExport = document.getElementById('btn-export-subscribers-csv');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const subs = adminDataAdapter.getSubscribers();
            if (subs.length === 0) {
                showAdminToast('No subscribers available to export.', 'warning');
                return;
            }
            const header = ['ID', 'Email', 'Source', 'Status', 'DateSubscribed'];
            const rows = subs.map(s => [
                `"${s.id || ''}"`,
                `"${s.email || ''}"`,
                `"${s.source || ''}"`,
                `"${s.status || 'active'}"`,
                `"${s.createdAt || ''}"`
            ].join(','));
            const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([header.join(','), ...rows].join('\n'));
            const link = document.createElement('a');
            link.setAttribute('href', csvContent);
            const dateStr = new Date().toISOString().slice(0, 10);
            link.setAttribute('download', `satvik_subscribers_${dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showAdminToast('📥 Exported subscribers CSV successfully!', 'success');
        });
    }

    // 4. Sub-Filter Tabs
    document.querySelectorAll('#subscribers-filter-tabs .filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#subscribers-filter-tabs .filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            adminState.subscribersFilter = tab.getAttribute('data-sub-filter') || 'all';
            renderSubscribersView();
        });
    });

    // 5. Search Input
    const searchInput = document.getElementById('input-search-subscribers');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            adminState.subscribersSearchQuery = e.target.value;
            renderSubscribersView();
        });
    }

    // 6. Manual Add Subscriber Modal
    const btnOpenModal = document.getElementById('btn-open-add-subscriber-modal');
    const btnCloseModal = document.getElementById('btn-close-subscriber-modal');
    const btnCancelModal = document.getElementById('btn-cancel-subscriber-modal');
    const formAddSub = document.getElementById('form-add-subscriber');

    if (btnOpenModal) btnOpenModal.addEventListener('click', () => openModal('modal-subscriber'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => closeModal('modal-subscriber'));
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => closeModal('modal-subscriber'));

    if (formAddSub) {
        formAddSub.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('sub-field-email');
            const sourceInput = document.getElementById('sub-field-source');
            const email = emailInput ? emailInput.value.trim() : '';
            const source = sourceInput ? sourceInput.value : 'admin_manual';

            try {
                adminDataAdapter.addSubscriber({ email, source });
                showAdminToast(`Subscriber "${email}" added successfully!`, 'success');
                closeModal('modal-subscriber');
                formAddSub.reset();
                renderSubscribersView();
            } catch (err) {
                showAdminToast(err.message, 'error');
            }
        });
    }

    // 7. Realtime cross-tab and data adapter events
    window.addEventListener('storage', (e) => {
        if (e.key === 'satvik_subscribers_sync' || e.key === 'satvik_newsletter_subscribers') {
            if (adminState.activeView === 'view-subscribers') {
                renderSubscribersView();
            } else {
                updateSubscribersBadge();
            }
        }
    });

    window.addEventListener('satvik_subscribers_updated', () => {
        if (adminState.activeView === 'view-subscribers') {
            renderSubscribersView();
        } else {
            updateSubscribersBadge();
        }
    });

    if (typeof adminDataAdapter !== 'undefined' && typeof adminDataAdapter.subscribe === 'function') {
        adminDataAdapter.subscribe('subscribers', () => {
            if (adminState.activeView === 'view-subscribers') {
                renderSubscribersView();
            } else {
                updateSubscribersBadge();
            }
        });
    }

    // Initial badge update
    updateSubscribersBadge();
}

// Auto-run initSubscribersManagementEvents when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubscribersManagementEvents);
} else {
    initSubscribersManagementEvents();
}
