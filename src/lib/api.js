/**
 * SMART KIRANA — Enterprise Security Client API Layer
 * Connects frontend React components to the backend security server
 */

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('smart_kirana_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If unauthorized, clear expired token
      if (res.status === 401 && endpoint !== '/auth/admin/login' && endpoint !== '/auth/otp/verify') {
        localStorage.removeItem('smart_kirana_auth_token');
        localStorage.removeItem('smart_kirana_user_role');
      }
      return {
        success: false,
        status: res.status,
        error: data.error || 'REQUEST_FAILED',
        message: data.message || `Request failed with status ${res.status}`
      };
    }

    return {
      success: true,
      status: res.status,
      ...data
    };
  } catch (err) {
    console.warn(`[API_OFFLINE] Request to ${url} failed, using fallback:`, err.message);
    return {
      success: false,
      status: 0,
      error: 'NETWORK_ERROR',
      message: 'Could not connect to security server. Ensure server is running.'
    };
  }
}

export const api = {
  // Authentication
  requestOtp: (phone, channel = 'sms', countryCode = '91') => request('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ phone, channel, countryCode })
  }),

  verifyOtp: (phone, otp, name) => request('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, otp, name })
  }),

  adminLogin: (email, password) => request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  getProfile: () => request('/auth/me'),

  // Products
  getProducts: () => request('/products'),

  // Checkout & Orders
  checkout: (payload, idempotencyKey = '') => request('/orders/checkout', {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    body: JSON.stringify(payload)
  }),

  getMyOrders: () => request('/orders/my'),
  
  getOrder: (id) => request(`/orders/${id}`),

  cancelOrder: (id) => request(`/orders/${id}/cancel`, {
    method: 'POST'
  }),

  // Payments
  verifyTestPayment: (orderId) => request('/payments/verify-test', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  }),

  // Admin Portal Operations
  adminGetOrders: () => request('/admin/orders'),

  adminUpdateOrderStatus: (orderId, status, note = '') => request(`/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note })
  }),

  adminAddProduct: (productData) => request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),

  adminUploadImage: (imageData) => request('/admin/upload-image', {
    method: 'POST',
    body: JSON.stringify(imageData)
  }),

  adminUpdateProduct: (id, fields) => request(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields)
  }),

  adminDeleteProduct: (id) => request(`/admin/products/${id}`, {
    method: 'DELETE'
  }),

  adminGetKpis: () => request('/admin/kpis'),

  adminGetAuditLogs: () => request('/admin/audit-logs'),

  adminGetSettings: () => request('/admin/settings'),

  adminUpdateSettings: (settings) => request('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),

  // Admin Staff & Password Management
  adminGetStaff: () => request('/admin/staff'),

  adminCreateStaff: (staffData) => request('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(staffData)
  }),

  adminChangePassword: (newPassword) => request('/admin/change-password', {
    method: 'PUT',
    body: JSON.stringify({ newPassword })
  })
};
