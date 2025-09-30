import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  },
  
  // Categories
  categories: {
    getAll: () => api.get('/api/categories'),
    getById: (id) => api.get(`/api/categories/${id}`),
  },
  
  // Courses
  courses: {
    getAll: (params = {}) => api.get('/api/courses', { params }),
    getById: (id) => api.get(`/api/courses/${id}`),
    getFeatured: () => api.get('/api/courses/featured'),
  },
  
  // Auth
  auth: {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    verify: () => api.get('/api/auth/verify'),
  },
};

export default api;
