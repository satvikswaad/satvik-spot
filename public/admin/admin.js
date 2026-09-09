import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Inactivity Timer Configuration (15 Minutes Total, 2 Min Warning)
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
const WARNING_LIMIT_MS = 13 * 60 * 1000;
let lastActivityTime = Date.now();
let inactivityInterval = null;

// Initialize Event Listeners safely via addEventListener (NO inline handlers)
document.addEventListener('DOMContentLoaded', () => {
    const btnLogin = document.getElementById('btn-login');
    const btnGoogle = document.getElementById('btn-google-login');
    const inputPass = document.getElementById('a-pass');
    const linkForgot = document.getElementById('link-forgot');
    const btnReset = document.getElementById('btn-reset');
    const linkBack = document.getElementById('link-back');
    const btnLogout = document.getElementById('btn-logout');
    const btnStay = document.getElementById('btn-stay');

    if (btnLogin) btnLogin.addEventListener('click', handleAdminLogin);
    if (btnGoogle) btnGoogle.addEventListener('click', handleGoogleAdminLogin);
    if (inputPass) inputPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdminLogin(); });
    if (linkForgot) linkForgot.addEventListener('click', (e) => { e.preventDefault(); showResetForm(); });
    if (btnReset) btnReset.addEventListener('click', handlePasswordReset);
    if (linkBack) linkBack.addEventListener('click', (e) => { e.preventDefault(); hideResetForm(); });
    if (btnLogout) btnLogout.addEventListener('click', handleAdminLogout);
    if (btnStay) btnStay.addEventListener('click', resetInactivityTimer);
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
                    showPortalView(user, idTokenResult.claims);
                    startInactivityTimer();

                    // Optional background telemetry / audit heartbeat ping
                    const token = idTokenResult.token;
                    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                        ? 'http://localhost:8080' 
                        : 'https://satvik-spot-backend-staging.onrender.com';
                    fetch(`${apiBase}/api/v1/admin/dashboard-summary`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => null);
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
            cleanupOrdersStream();
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

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    try {
        await signInWithEmailAndPassword(window.auth, email, pass);
    } catch (e) {
        console.warn("Firebase login:", e.code || e.message);
        // Localhost development login fallback
        if (isLocalhost && (email === 'admin@satvikswaad.com' || email === 'admin@satvikspot.com' || email.includes('admin')) && pass.length >= 6) {
            const mockUser = {
                uid: 'admin_local_dev',
                email: email
            };
            const mockClaims = {
                admin: true,
                role: 'admin_owner'
            };
            showPortalView(mockUser, mockClaims);
            startInactivityTimer();
            showInfo("Authenticated via Localhost Development Session.");
            return;
        }
        showError("Invalid email or password.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sign In →";
    }
}

// Google Admin Login Handler
export async function handleGoogleAdminLogin() {
    const btn = document.getElementById('btn-google-login');
    hideMessages();

    if (!window.auth) {
        showError("Authentication service is initializing. Please refresh.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Connecting to Google...";
    }

    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(window.auth, provider);
    } catch (e) {
        console.warn("Google admin login error:", e);
        if (e && e.code !== 'auth/popup-closed-by-user') {
            showError("Google sign-in failed. Please try again or use Email & Password.");
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg> Sign In with Google (Admin)`;
        }
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
    cleanupOrdersStream();
    stopInactivityTimer();
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
    document.getElementById('dbg-uid').textContent = user.uid;
    document.getElementById('dbg-email').textContent = user.email || 'N/A';
    document.getElementById('dbg-admin-claim').textContent = claims.admin ? 'true' : 'false';

    subscribeToOrdersStream();
}

function showLoginView() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('portal-container').style.display = 'none';
    document.getElementById('a-pass').value = '';
}

function hideMessages() {
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-info').style.display = 'none';
}

function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = '❌ ' + msg;
    el.style.display = 'block';
}

function showInfo(msg) {
    const el = document.getElementById('auth-info');
    el.textContent = '✅ ' + msg;
    el.style.display = 'block';
}

function showResetForm() {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('reset-form').classList.remove('d-none');
}

function hideResetForm() {
    document.getElementById('reset-form').classList.add('d-none');
    document.getElementById('login-form').classList.remove('d-none');
}

// ── REAL-TIME SYNC LIFECYCLE MANAGEMENT ─────────────────────────────────────
let ordersUnsubscribe = null;
let syncReconnectTimeout = null;

function updateSyncBadge(status, text) {
    const badge = document.getElementById('realtime-sync-badge');
    if (!badge) return;
    if (status === 'active') {
        badge.style.background = '#EAF5ED';
        badge.style.color = '#2C5E3B';
        badge.style.border = '1px solid #B8E1C2';
        badge.textContent = '● ' + (text || 'Live Sync Active');
    } else if (status === 'reconnecting') {
        badge.style.background = '#FEF3C7';
        badge.style.color = '#92400E';
        badge.style.border = '1px solid #FCD34D';
        badge.textContent = '⚠️ ' + (text || 'Reconnecting...');
    } else {
        badge.style.background = '#FDE8E8';
        badge.style.color = '#C0392B';
        badge.style.border = '1px solid #F8B4B4';
        badge.textContent = '❌ ' + (text || 'Disconnected');
    }
}

export function cleanupOrdersStream() {
    if (ordersUnsubscribe) {
        try {
            ordersUnsubscribe();
        } catch (e) {
            console.warn('Error unsubscribing from orders stream:', e);
        }
        ordersUnsubscribe = null;
    }
    if (syncReconnectTimeout) {
        clearTimeout(syncReconnectTimeout);
        syncReconnectTimeout = null;
    }
    updateSyncBadge('disconnected', 'Sync Paused');
}

// Global teardown listeners
window.addEventListener('beforeunload', () => {
    cleanupOrdersStream();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.auth?.currentUser && !ordersUnsubscribe) {
        subscribeToOrdersStream();
    }
});

// SAFE DOM rendering for real-time orders stream (ZERO innerHTML concatenation)
function subscribeToOrdersStream() {
    const wrap = document.getElementById('admin-orders-stream');
    if (!wrap || !window.db) return;

    if (ordersUnsubscribe) {
        ordersUnsubscribe();
        ordersUnsubscribe = null;
    }

    try {
        updateSyncBadge('reconnecting', 'Connecting...');
        const q = query(collection(window.db, 'orders'), orderBy('createdAt', 'desc'));
        ordersUnsubscribe = onSnapshot(q, (snap) => {
            updateSyncBadge('active', 'Live Sync Active');
            if (snap.empty) {
                const emptyP = document.createElement('p');
                emptyP.style.color = '#888';
                emptyP.textContent = 'No orders found in database.';
                wrap.replaceChildren(emptyP);
                return;
            }

            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '16px';

            snap.docs.forEach(d => {
                const o = d.data();
                const orderId = d.id;

                const card = document.createElement('div');
                card.style.background = '#FFFFFF';
                card.style.border = '2px solid #E8E1D7';
                card.style.padding = '18px';
                card.style.borderRadius = '12px';
                card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';

                // Top Header Row
                const headerRow = document.createElement('div');
                headerRow.style.display = 'flex';
                headerRow.style.justifyContent = 'space-between';
                headerRow.style.alignItems = 'center';
                headerRow.style.marginBottom = '10px';

                const titleStrong = document.createElement('strong');
                titleStrong.style.fontFamily = "'Playfair Display', serif";
                titleStrong.style.fontSize = '1.1rem';
                titleStrong.style.color = '#7A1C1C';
                titleStrong.textContent = `Order #${orderId.slice(-6).toUpperCase()}`;

                const badgeSpan = document.createElement('span');
                badgeSpan.style.padding = '4px 12px';
                badgeSpan.style.borderRadius = '20px';
                badgeSpan.style.fontSize = '0.78rem';
                badgeSpan.style.fontWeight = '800';

                const pStatus = o.paymentStatus || 'PAYMENT_PENDING';
                if (pStatus === 'PAYMENT_VERIFIED' || pStatus === 'PAYMENT_CONFIRMED') {
                    badgeSpan.style.background = '#EAF5ED';
                    badgeSpan.style.color = '#2C5E3B';
                    badgeSpan.textContent = pStatus === 'PAYMENT_CONFIRMED' ? '💳 PAYMENT_CONFIRMED' : '✅ PAYMENT_VERIFIED';
                } else if (pStatus === 'PAYMENT_REJECTED' || pStatus === 'PAYMENT_FAILED') {
                    badgeSpan.style.background = '#FDE8E8';
                    badgeSpan.style.color = '#C0392B';
                    badgeSpan.textContent = pStatus === 'PAYMENT_FAILED' ? '❌ PAYMENT_FAILED' : '❌ PAYMENT_REJECTED';
                } else if (pStatus === 'REFUNDED' || pStatus === 'REFUND_INITIATED') {
                    badgeSpan.style.background = '#EDE9FE';
                    badgeSpan.style.color = '#6D28D9';
                    badgeSpan.textContent = '🔄 ' + pStatus;
                } else {
                    badgeSpan.style.background = '#FEF3D6';
                    badgeSpan.style.color = '#C8521A';
                    badgeSpan.textContent = '⏳ PAYMENT_PENDING';
                }

                headerRow.appendChild(titleStrong);
                headerRow.appendChild(badgeSpan);

                // Details Text with Denormalized Customer Snapshot
                const detailsDiv = document.createElement('div');
                detailsDiv.style.fontSize = '0.9rem';
                detailsDiv.style.color = '#555';
                detailsDiv.style.marginBottom = '8px';
                const custName = o.customerName || o.name || 'N/A';
                const custPhone = o.customerPhone || o.phone || 'N/A';
                detailsDiv.textContent = `Customer: ${custName} | Phone: ${custPhone} | Status: ${o.status || 'Pending'}`;

                // Denormalized Items Summary
                if (o.itemSummary) {
                    const itemsDiv = document.createElement('div');
                    itemsDiv.style.fontSize = '0.85rem';
                    itemsDiv.style.color = '#7A1C1C';
                    itemsDiv.style.fontWeight = '600';
                    itemsDiv.style.marginBottom = '8px';
                    itemsDiv.textContent = `📦 Items: ${o.itemSummary}`;
                    card.appendChild(itemsDiv);
                }

                const totalDiv = document.createElement('div');
                totalDiv.style.fontSize = '0.95rem';
                totalDiv.style.fontWeight = '700';
                totalDiv.style.color = '#2A211D';
                totalDiv.style.marginBottom = '12px';
                totalDiv.textContent = `Total: ₹${o.total} (Subtotal: ₹${o.subtotal}, Delivery: ₹${o.shippingFee})`;

                card.appendChild(headerRow);
                card.appendChild(detailsDiv);
                card.appendChild(totalDiv);

                // Payment Action Controls (Only for PAYMENT_PENDING)
                if (pStatus === 'PAYMENT_PENDING' || pStatus === 'Unpaid') {
                    const actionsBox = document.createElement('div');
                    actionsBox.style.background = '#FAF7F2';
                    actionsBox.style.border = '1px dashed #C8521A';
                    actionsBox.style.padding = '12px';
                    actionsBox.style.borderRadius = '8px';
                    actionsBox.style.marginTop = '10px';

                    const confirmLabel = document.createElement('label');
                    confirmLabel.style.display = 'flex';
                    confirmLabel.style.alignItems = 'center';
                    confirmLabel.style.gap = '8px';
                    confirmLabel.style.fontSize = '0.85rem';
                    confirmLabel.style.fontWeight = '700';
                    confirmLabel.style.marginBottom = '10px';
                    confirmLabel.style.cursor = 'pointer';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `chk-credit-${orderId}`;

                    const checkText = document.createTextNode(`I confirm I have verified the actual credit of ₹${o.total} in official bank account.`);
                    confirmLabel.appendChild(checkbox);
                    confirmLabel.appendChild(checkText);

                    const btnRow = document.createElement('div');
                    btnRow.style.display = 'flex';
                    btnRow.style.gap = '10px';

                    const btnAccept = document.createElement('button');
                    btnAccept.textContent = 'Accept Payment ✅';
                    btnAccept.style.background = '#2C5E3B';
                    btnAccept.style.color = '#FFF';
                    btnAccept.style.border = 'none';
                    btnAccept.style.padding = '8px 16px';
                    btnAccept.style.borderRadius = '6px';
                    btnAccept.style.fontWeight = '700';
                    btnAccept.style.cursor = 'pointer';

                    btnAccept.addEventListener('click', async () => {
                        if (!checkbox.checked) {
                            alert('You must check the bank credit verification box before accepting payment.');
                            return;
                        }
                        btnAccept.disabled = true;
                        btnAccept.textContent = 'Verifying...';
                        await handleAdminPaymentVerification(orderId, 'ACCEPT', true);
                    });

                    const btnReject = document.createElement('button');
                    btnReject.textContent = 'Reject Payment ❌';
                    btnReject.style.background = '#C0392B';
                    btnReject.style.color = '#FFF';
                    btnReject.style.border = 'none';
                    btnReject.style.padding = '8px 16px';
                    btnReject.style.borderRadius = '6px';
                    btnReject.style.fontWeight = '700';
                    btnReject.style.cursor = 'pointer';

                    btnReject.addEventListener('click', async () => {
                        const reason = prompt('Enter rejection reason (visible to customer):', 'Payment credit not received');
                        if (!reason || reason.trim().length < 3) return;
                        btnReject.disabled = true;
                        btnReject.textContent = 'Rejecting...';
                        await handleAdminPaymentVerification(orderId, 'REJECT', false, reason.trim());
                    });

                    btnRow.appendChild(btnAccept);
                    btnRow.appendChild(btnReject);

                    actionsBox.appendChild(confirmLabel);
                    actionsBox.appendChild(btnRow);
                    card.appendChild(actionsBox);
                }

                container.appendChild(card);
            });

            wrap.replaceChildren(container);
        }, (err) => {
            console.warn("Orders stream note:", err.message);
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocalhost) {
                updateSyncBadge('active', 'Localhost Dev Mode');
                renderLocalDevOrders(wrap);
                return;
            }
            updateSyncBadge('reconnecting', 'Connection Interrupted');
            const errP = document.createElement('p');
            errP.style.color = '#C0392B';
            errP.style.fontWeight = '700';
            errP.textContent = `⚠️ Real-time connection interrupted: ${err.message}. Retrying in 5s...`;
            wrap.replaceChildren(errP);

            if (!syncReconnectTimeout) {
                syncReconnectTimeout = setTimeout(() => {
                    syncReconnectTimeout = null;
                    if (window.auth?.currentUser) {
                        subscribeToOrdersStream();
                    }
                }, 5000);
            }
        });
    } catch (e) {
        console.error("Stream init error:", e);
        updateSyncBadge('disconnected', 'Init Failed');
    }
}

async function handleAdminPaymentVerification(orderId, action, confirmBankCredit, reason, receivedAmount, reasonCode, paymentMethod, utr) {
    try {
        const token = await window.auth.currentUser.getIdToken();
        const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8080'
            : 'https://satvik-spot-backend-staging.onrender.com';

        const res = await fetch(`${apiBase}/api/v1/admin/orders/${encodeURIComponent(orderId)}/verify-payment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                confirmBankCredit,
                reason,
                receivedAmount: receivedAmount !== undefined ? Number(receivedAmount) : undefined,
                reasonCode,
                paymentMethod,
                utr
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error?.message || 'Payment verification action failed');
        }

        alert(`✅ Payment status updated successfully: ${data.data?.paymentStatus || action}`);
    } catch (err) {
        console.error("Payment verification error:", err);
        alert(`❌ Error: ${err.message}`);
    }
}

// ── LOCALHOST DEV ORDERS RENDERER ──────────────────────────────────────────
function renderLocalDevOrders(wrap) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '16px';

    const sampleOrders = [
        {
            id: 'ORD-2026-DEV-001',
            createdAt: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
            customerName: 'Aarav Sharma',
            customerPhone: '+91 98765 43210',
            itemSummary: 'Aam Ka Achar (500g) x 1, Satvik Chyawanprash (1kg) x 1',
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            total: 1048,
            subtotal: 999,
            shippingFee: 49
        },
        {
            id: 'ORD-2026-DEV-002',
            createdAt: new Date(Date.now() - 3600000).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
            customerName: 'Priya Verma',
            customerPhone: '+91 91234 56789',
            itemSummary: 'Amla Murabba (500g) x 2, Mirchi Ka Achar (250g) x 1',
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            total: 798,
            subtotal: 798,
            shippingFee: 0
        },
        {
            id: 'ORD-2026-DEV-003',
            createdAt: new Date(Date.now() - 7200000).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
            customerName: 'Rohan Gupta',
            customerPhone: '+91 99887 76655',
            itemSummary: 'Nimbu Khatta Meetha Achar (500g) x 1',
            status: 'PENDING',
            paymentStatus: 'PAYMENT_PENDING',
            total: 349,
            subtotal: 299,
            shippingFee: 50
        }
    ];

    sampleOrders.forEach(o => {
        const card = document.createElement('div');
        card.style.background = '#FFFFFF';
        card.style.border = '2px solid #E8E1D7';
        card.style.padding = '18px';
        card.style.borderRadius = '12px';

        const headerRow = document.createElement('div');
        headerRow.style.display = 'flex';
        headerRow.style.justifyContent = 'space-between';
        headerRow.style.alignItems = 'center';
        headerRow.style.marginBottom = '10px';

        const title = document.createElement('h4');
        title.style.margin = '0';
        title.style.color = '#7A1C1C';
        title.textContent = `Order #${o.id} • ${o.createdAt}`;

        const badge = document.createElement('span');
        badge.style.padding = '4px 10px';
        badge.style.borderRadius = '20px';
        badge.style.fontSize = '0.8rem';
        badge.style.fontWeight = '800';
        badge.style.background = o.paymentStatus === 'PAID' ? '#EAF5ED' : '#FFF3CD';
        badge.style.color = o.paymentStatus === 'PAID' ? '#2C5E3B' : '#856404';
        badge.textContent = `${o.status} | ${o.paymentStatus}`;

        headerRow.appendChild(title);
        headerRow.appendChild(badge);

        const detailsDiv = document.createElement('div');
        detailsDiv.style.fontSize = '0.9rem';
        detailsDiv.style.color = '#665B55';
        detailsDiv.style.marginBottom = '6px';
        detailsDiv.textContent = `Customer: ${o.customerName} | Phone: ${o.customerPhone}`;

        const itemsDiv = document.createElement('div');
        itemsDiv.style.fontSize = '0.85rem';
        itemsDiv.style.color = '#7A1C1C';
        itemsDiv.style.fontWeight = '600';
        itemsDiv.style.marginBottom = '8px';
        itemsDiv.textContent = `📦 Items: ${o.itemSummary}`;

        const totalDiv = document.createElement('div');
        totalDiv.style.fontSize = '0.95rem';
        totalDiv.style.fontWeight = '700';
        totalDiv.style.color = '#2A211D';
        totalDiv.textContent = `Total: ₹${o.total} (Subtotal: ₹${o.subtotal}, Delivery: ₹${o.shippingFee})`;

        card.appendChild(headerRow);
        card.appendChild(detailsDiv);
        card.appendChild(itemsDiv);
        card.appendChild(totalDiv);

        container.appendChild(card);
    });

    wrap.replaceChildren(container);
}
