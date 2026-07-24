import {
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
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
                    // Authoritative Backend Authorization Check
                    const token = idTokenResult.token;
                    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                        ? 'http://localhost:8080' 
                        : 'https://satvik-spot-backend-staging.onrender.com';

                    const authRes = await fetch(`${apiBase}/api/v1/admin/dashboard-summary`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => null);

                    if (authRes && authRes.status === 200) {
                        showPortalView(user, idTokenResult.claims);
                        startInactivityTimer();
                    } else {
                        console.warn("Backend API authorization rejected user UID:", user.uid);
                        await signOut(window.auth);
                        showError("Access Denied: Administrative privileges rejected by server policy.");
                    }
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

// SAFE DOM rendering for real-time orders stream (ZERO innerHTML concatenation)
function subscribeToOrdersStream() {
    const wrap = document.getElementById('admin-orders-stream');
    if (!wrap || !window.db) return;

    try {
        const q = query(collection(window.db, 'orders'), orderBy('createdAt', 'desc'));
        onSnapshot(q, (snap) => {
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
                if (pStatus === 'PAYMENT_VERIFIED') {
                    badgeSpan.style.background = '#EAF5ED';
                    badgeSpan.style.color = '#2C5E3B';
                    badgeSpan.textContent = '✅ PAYMENT_VERIFIED';
                } else if (pStatus === 'PAYMENT_REJECTED') {
                    badgeSpan.style.background = '#FDE8E8';
                    badgeSpan.style.color = '#C0392B';
                    badgeSpan.textContent = '❌ PAYMENT_REJECTED';
                } else {
                    badgeSpan.style.background = '#FEF3D6';
                    badgeSpan.style.color = '#C8521A';
                    badgeSpan.textContent = '⏳ PAYMENT_PENDING';
                }

                headerRow.appendChild(titleStrong);
                headerRow.appendChild(badgeSpan);

                // Details Text
                const detailsDiv = document.createElement('div');
                detailsDiv.style.fontSize = '0.9rem';
                detailsDiv.style.color = '#555';
                detailsDiv.style.marginBottom = '8px';
                detailsDiv.textContent = `Customer: ${o.name || 'N/A'} | Phone: ${o.phone || 'N/A'} | Pincode: ${o.pincode || 'N/A'}`;

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
            console.error("Orders stream error:", err);
            const errP = document.createElement('p');
            errP.style.color = 'red';
            errP.textContent = `Security Rule Error: ${err.message}`;
            wrap.replaceChildren(errP);
        });
    } catch (e) {
        console.error("Stream init error:", e);
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
