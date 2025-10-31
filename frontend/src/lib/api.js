import axios from 'axios';

// Use the actual IP address of your backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.10.78:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Helpers
export const apiHelpers = {
  // Products
  products: {
    getAll: (params = {}) => api.get('/api/products', { params }),
    getById: (id) => api.get(`/api/products/${id}`),
    getFeatured: () => api.get('/api/products/featured'),
    update: (id, data) => api.put(`/api/products/${id}`, data),
  },

  // Coins
  coins: {
    // Get user's coin balance
    getBalance: (userId) => api.get(`/api/coins/balance/${userId}`),
    
    // Update user's coins (admin only)
    updateCoins: (userId, amount, reason) => 
      api.put(`/api/coins/update/${userId}`, { amount, reason }),
      
    // Transfer coins between users
    transfer: (toUserId, amount) => 
      api.post('/api/coins/transfer', { toUserId, amount })
  },

  // Users
  users: {
    list: async () => {
      try {
        const response = await api.get('/api/users/prerit');
        console.log('Raw API response in helper:', response);
        
        // Handle the nested data structure: { success: true, data: [...] }
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log('Returning users from response.data.data:', response.data.data);
          return response.data.data;
        }
        // Fallback to direct data array
        if (response.data && Array.isArray(response.data)) {
          console.log('Returning users from response.data:', response.data);
          return response.data;
        }
        // If the response is already an array (shouldn't happen with current API)
        if (Array.isArray(response)) {
          console.log('Returning direct array response:', response);
          return response;
        }
        // If we can't determine the format, return an empty array
        console.warn('Unexpected API response format:', response);
        return [];
      } catch (error) {
        console.error('Error fetching users:', error);
        
        if (error.code === 'ERR_NETWORK') {
          console.error('Backend server is not running or not accessible');
          // Return mock data for development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Using mock data for development');
            return [
              { id: 1, name: 'Test Admin', email: 'admin@example.com', role: 'admin' },
              { id: 2, name: 'Test User', email: 'user@example.com', role: 'student' },
            ];
          }
        }
        
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        
        throw error;
      }
    },
    create: (data) => api.post('/api/users/prerit', data),
    update: (id, data) => api.put(`/api/users/${id}`, data),
    remove: (id) => api.delete(`/api/users/${id}`),
    updateCoins: (userId, amount) =>
      api.put(`/api/users/${userId}/coins`, { amount }),
    getProfile: () => api.get('/api/users/me'),
    updateProfile: (data) => api.put('/api/users/me', data),
  },
  
  // Categories
  categories: {
    getAll: () => api.get('/api/categories'),
    getById: (id) => api.get(`/api/categories/${id}`),
    getCourses: (id) => api.get(`/api/categories/${id}/courses`),
  },
  
  // Courses
  courses: {
    getAll: (params = {}) => api.get('/api/courses', { params }),
    getById: (id) => api.get(`/api/courses/${id}`),
    getFeatured: () => api.get('/api/courses/featured'),
  },

  // Cart
  cart: {
    get: () => api.get('/api/cart/my-cart'),
    addItem: (data) => api.post('/api/cart/add-item', data),
    updateItem: (courseId, data) => api.put(`/api/cart/update-item/${courseId}`, data),
    removeItem: (courseId, config = {}) => api.delete(`/api/cart/remove-item/${courseId}`, config),
    clear: () => api.delete('/api/cart/clear'),
    summary: () => api.get('/api/cart/summary'),
  },
  
  // Auth
  auth: {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    verify: () => api.get('/api/auth/verify'),
    logout: () => api.post('/api/auth/logout'),
  },

  // Analytics
  analytics: {
    getDashboard: () => api.get('/api/analytics/dashboard'),
    getRevenue: () => api.get('/api/analytics/revenue'),
    getUsers: () => api.get('/api/analytics/users'),
    getProducts: () => api.get('/api/analytics/products'),
  },

  // Activities
  activities: {
    getRecent: (params = {}) => api.get('/api/activities/recent', { params }),
    getStats: () => ({
      totalActivities: 0,
      activitiesByType: {},
      recentActivities: []
    }), // Mock stats since the endpoint doesn't exist yet
    logActivity: (data) => api.post('/api/activities/log', data),
  },
};

export default api;
