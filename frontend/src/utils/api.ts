import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add request ID for debugging
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(7);

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and responses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    }

    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Forbidden - show error message
      if (typeof window !== 'undefined') {
        // You can show a toast here if needed
        console.error('Access forbidden');
      }
    } else if (error.response?.status === 429) {
      // Too many requests
      if (typeof window !== 'undefined') {
        console.error('Too many requests. Please try again later.');
      }
    } else if (error.response?.status === 500) {
      // Server error
      if (typeof window !== 'undefined') {
        console.error('Server error. Please try again later.');
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      if (typeof window !== 'undefined') {
        console.error('Request timeout. Please check your connection.');
      }
    } else if (!error.response) {
      // Network error
      if (typeof window !== 'undefined') {
        console.error('Network error. Please check your connection.');
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const apiMethods = {
  // Authentication
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: any }>>('/api/auth/login', { email, password }),

  register: (name: string, email: string, password: string, role: string = 'student') =>
    api.post<ApiResponse<{ message: string }>>('/api/auth/register', { name, email, password, role }),

  verifyToken: () =>
    api.get<ApiResponse<{ user: any }>>('/api/auth/verify'),

  refreshToken: () =>
    api.post<ApiResponse<{ token: string }>>('/api/auth/refresh'),

  // Courses
  getCourses: (params?: any) =>
    api.get<ApiResponse<any[]>>('/api/courses', { params }),

  getCourse: (id: string | number) =>
    api.get<ApiResponse<any>>(`/api/courses/${id}`),

  searchCourses: (query: string, filters?: any) =>
    api.get<ApiResponse<any[]>>('/api/courses/search', { params: { query, ...filters } }),

  // Student
  enrollInCourse: (courseId: string | number) =>
    api.post<ApiResponse<any>>(`/api/student/enroll/${courseId}`, {}),

  checkEnrollment: (courseId: string | number) =>
    api.get<ApiResponse<{ enrolled: boolean; enrollment: any }>>(`/api/student/enrollment/${courseId}`),

  getMyCourses: () =>
    api.get<ApiResponse<{ courses: any[]; stats: any }>>('/api/student/my-courses'),

  getCourseProgress: (courseId: string | number) =>
    api.get<ApiResponse<any>>(`/api/student/progress/${courseId}`),

  updateCourseProgress: (courseId: string | number, progress: number) =>
    api.put<ApiResponse<any>>(`/api/student/progress/${courseId}`, { progress }),

  getProfile: () =>
    api.get<ApiResponse<any>>('/api/student/profile'),

  updateProfile: (data: any) =>
    api.put<ApiResponse<any>>('/api/student/profile', data),

  getEnrollmentStats: () =>
    api.get<ApiResponse<any>>('/api/student/stats'),

  // Categories
  getCategories: () =>
    api.get<ApiResponse<any[]>>('/api/categories'),

  // Instructors
  getInstructors: () =>
    api.get<ApiResponse<any[]>>('/api/instructors'),

  // Analytics
  getAnalytics: () =>
    api.get<ApiResponse<any>>('/api/analytics'),

  // Activities
  getActivities: () =>
    api.get<ApiResponse<any[]>>('/api/activities'),
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

// Success response utility
export const isApiSuccess = (response: any): boolean => {
  return response?.data?.success === true;
};

export default api;
