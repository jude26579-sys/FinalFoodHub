// API Configuration
// Use relative paths so Vite proxy can route to correct backends
export const API_BASE_URL = '/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  
  // Customers
  CUSTOMERS: {
    BASE: '/customers',
    REGISTER: '/customers/register',
  },
  
  // Vendors
  VENDORS: {
    BASE: '/vendors',
    REGISTER: '/vendors/register',
  },
  
  // Restaurants
  RESTAURANTS: {
    BASE: '/restaurants',
    BY_ID: (id) => `/restaurants/${id}`,
    BY_VENDOR: (vendorId) => `/restaurants/vendor/${vendorId}`,
  },
  
  // Menu Items
  MENU_ITEMS: {
    BASE: '/menu',
    BY_ID: (id) => `/menu/id/${id}`,
    BY_NAME: (name) => `/menu/name/${name}`,
    BY_RESTAURANT: (restaurantId) => `/menu/restaurant/${restaurantId}`,
  },
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    BY_CUSTOMER: (customerId) => `/orders/customer/${customerId}`,
    BY_VENDOR: (vendorId) => `/orders/vendor/${vendorId}`,
  },
  
  // Cart
  CART: {
    BASE: '/cart',
    BY_ID: (id) => `/cart/${id}`,
    ADD: '/cart',
    UPDATE: (id) => `/cart/${id}`,
    DELETE: (id) => `/cart/${id}`,
  },

  // Feedback
  FEEDBACK: {
    BASE: '/feedback',
    BY_ID: (id) => `/feedback/${id}`,
    BY_RESTAURANT: (restaurantId) => `/feedback/restaurant/${restaurantId}`,
  },
  
  // Reports (Admin)
  REPORTS: {
    SALES: '/reports/sales',
    VENDORS: '/reports/vendors',
  },

  FEEDBACK: {
  BASE: "/feedback",
  SUBMIT: "/feedback",
  ALL: "/feedback",
  BY_RESTAURANT: (id) => `/feedback/restaurant/${id}`,
  BY_ITEM: (id) => `/feedback/item/${id}`,
  BY_USER: (id) => `/feedback/user/${id}`,
},

};

// HTTP Methods helper with optional token
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  // Add auth token if available - check both accessToken (OAuth2) and authToken (legacy)
  // Skip token for restaurant/menu endpoints if specified (for development)
  const skipToken = options.skipToken === true;
  const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
  
  if (token && !skipToken) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Special function for restaurant/menu endpoints that might have security issues
export const apiRequestNoAuth = async (endpoint) => {
  return apiRequest(endpoint, { skipToken: true });
};
