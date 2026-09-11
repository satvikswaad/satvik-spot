/**
 * Satvik Swaad - PayU Hosted Checkout Client Service
 * 
 * Implements secure hosted checkout form auto-submission,
 * resilient session handling, and optimistic cart protection.
 */

export function submitPayUForm(actionUrl, params) {
  if (!actionUrl || !params || typeof params !== 'object') {
    throw new Error('Invalid PayU form configuration: actionUrl and params required');
  }

  // Remove any pre-existing temporary PayU submission forms
  const existingForm = document.getElementById('payu-auto-submit-form');
  if (existingForm) {
    existingForm.remove();
  }

  const form = document.createElement('form');
  form.id = 'payu-auto-submit-form';
  form.method = 'POST';
  form.action = actionUrl;
  form.style.display = 'none';

  // Populate all cryptographic parameters returned from server
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  });

  document.body.appendChild(form);
  
  // Submit the form to redirect user directly to PayU hosted checkout
  form.submit();
}

/**
 * Initiates a PayU payment request to the authoritative backend endpoint.
 *
 * @param {Object} orderPayload - Validated checkout order details
 * @param {Object} [options] - Additional runtime options
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function initiatePayUPayment(orderPayload, options = {}) {
  const apiBaseUrl = String(
    window.API_BASE_URL || 
    ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000' 
      : 'https://satvik-spot-backend-staging.onrender.com')
  ).replace(/\/+$/, '');

  const headers = {
    'Content-Type': 'application/json'
  };

  // Attach Firebase App Check token if active
  if (typeof window.getAppCheckToken === 'function') {
    try {
      const appCheckToken = await window.getAppCheckToken();
      if (appCheckToken) {
        headers['X-Firebase-AppCheck'] = appCheckToken;
      }
    } catch (acErr) {
      console.warn('AppCheck token resolution warning:', acErr);
    }
  }

  // Attach Firebase Auth Bearer token if user is signed in
  if (window.auth?.currentUser) {
    try {
      const idToken = await window.auth.currentUser.getIdToken();
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (authErr) {
      console.warn('Firebase Auth token resolution warning:', authErr);
    }
  }

  const endpoint = `${apiBaseUrl}/api/v1/payments/payu/create-order`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderPayload)
    });

    const resJson = await response.json().catch(() => ({}));

    if (!response.ok || !resJson.success || !resJson.data) {
      const errMsg = resJson?.error?.message || `Payment initialization failed with status ${response.status}`;
      return { success: false, error: errMsg };
    }

    const { actionUrl, params } = resJson.data;

    // Cache order details locally before leaving page to ensure recovery
    try {
      localStorage.setItem('satvik_pending_payu_txnid', params.txnid);
      localStorage.setItem('satvik_pending_payu_order', JSON.stringify({
        txnid: params.txnid,
        amount: params.amount,
        productinfo: params.productinfo,
        initiatedAt: new Date().toISOString()
      }));
    } catch (storageErr) {
      console.warn('Local storage write warning:', storageErr);
    }

    // Auto-submit hidden form to navigate to PayU hosted payment page
    submitPayUForm(actionUrl, params);
    return { success: true, data: resJson.data };
  } catch (netErr) {
    console.error('PayU payment request network error:', netErr);
    return { 
      success: false, 
      error: netErr.message || 'Unable to connect to PayU payment gateway. Please check your connection.' 
    };
  }
}

// Attach to window for non-module integration
if (typeof window !== 'undefined') {
  window.payuService = {
    submitPayUForm,
    initiatePayUPayment
  };
}
