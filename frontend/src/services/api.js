// Normalize API Base URL: strip trailing slash, ensure /api is included cleanly
const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('parksmart_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    console.error(`[API Network Error] Could not connect to backend at ${API_BASE_URL}${normalizedEndpoint}:`, netErr.message);
    throw new Error('Could not connect to the ParkSmart server. If running on Render free tier, the server may take ~30-50 seconds to wake up. Please retry.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  registerCustomer: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: () => request('/auth/profile'),
  addVehicle: (payload) => request('/auth/vehicles', { method: 'POST', body: JSON.stringify(payload) }),
  deleteVehicle: (id) => request(`/auth/vehicles/${id}`, { method: 'DELETE' }),

  // Parking Locations & Discovery
  getLocations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/parking/locations${query ? `?${query}` : ''}`);
  },
  getLocationDetails: (id) => request(`/parking/locations/${id}`),

  // Customer Actions
  getCustomerDashboard: () => request('/customer/dashboard'),
  createBooking: (payload) => request('/customer/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  cancelBooking: (id, payload = {}) => request(`/customer/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify(payload) }),
  processPayment: (payload) => request('/customer/payments/process', { method: 'POST', body: JSON.stringify(payload) }),
  getCustomerAnalytics: () => request('/customer/analytics'),
  getNotifications: () => request('/customer/notifications'),
  markNotificationRead: (id) => request(`/customer/notifications/${id}/read`, { method: 'PUT' }),

  // Staff Operations
  getStaffDashboardStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/dashboard-stats${query ? `?${query}` : ''}`);
  },
  recordVehicleEntry: (payload) => request('/staff/entry', { method: 'POST', body: JSON.stringify(payload) }),
  markVehicleExit: (payload) => request('/staff/exit', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (payload) => request('/staff/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),
  manualOverrideExit: (payload) => request('/staff/manual-override', { method: 'POST', body: JSON.stringify(payload) }),
  getActiveVehicles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/active-vehicles${query ? `?${query}` : ''}`);
  },
  getSlotGrid: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/slot-grid${query ? `?${query}` : ''}`);
  },
  updateSlotStatus: (slotId, payload) => request(`/staff/slots/${slotId}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  getCustomerRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/customers${query ? `?${query}` : ''}`);
  },
  getParkingHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/history${query ? `?${query}` : ''}`);
  },
  getStaffAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/staff/analytics${query ? `?${query}` : ''}`);
  },
};
