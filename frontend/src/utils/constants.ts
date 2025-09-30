// App Configuration
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'EduPlatform',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  supportEmail: 'support@eduplatform.com',
  contactEmail: 'contact@eduplatform.com',
  socialLinks: {
    twitter: 'https://twitter.com/eduplatform',
    linkedin: 'https://linkedin.com/company/eduplatform',
    facebook: 'https://facebook.com/eduplatform',
    instagram: 'https://instagram.com/eduplatform',
  },
};

// Route Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Student Routes
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    COURSES: '/student/my-courses',
    BROWSE: '/student/browse',
    COURSE_DETAILS: '/student/courses',
    PROFILE: '/student/profile',
    CERTIFICATES: '/student/certificates',
    SETTINGS: '/student/settings',
  },
  
  // Admin Routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    COURSES: '/admin/courses',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
  },
  
  // Instructor Routes
  INSTRUCTOR: {
    DASHBOARD: '/instructor/dashboard',
    MY_COURSES: '/instructor/my-courses',
    STUDENTS: '/instructor/students',
    ANALYTICS: '/instructor/analytics',
    PROFILE: '/instructor/profile',
  },
  
  // Static Pages
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  FAQ: '/faq',
  BLOG: '/blog',
};

// Course Configuration
export const COURSE_LEVELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate', 
  advanced: 'Advanced',
} as const;

export const COURSE_STATUS = {
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
} as const;

export const ENROLLMENT_STATUS = {
  active: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  paused: 'Paused',
} as const;

export const CONTENT_TYPES = {
  video: 'Video',
  text: 'Text',
  quiz: 'Quiz',
  assignment: 'Assignment',
} as const;

// User Roles
export const USER_ROLES = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Administrator',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  COURSES: {
    LIST: '/api/courses',
    DETAIL: '/api/courses/:id',
    SEARCH: '/api/courses/search',
    CATEGORIES: '/api/courses/categories',
    FEATURED: '/api/courses/featured',
    POPULAR: '/api/courses/popular',
  },
  STUDENT: {
    PROFILE: '/api/student/profile',
    COURSES: '/api/student/my-courses',
    ENROLL: '/api/student/enroll/:id',
    PROGRESS: '/api/student/progress/:id',
    STATS: '/api/student/stats',
    ACTIVITIES: '/api/student/activities',
  },
  INSTRUCTOR: {
    PROFILE: '/api/instructor/profile',
    COURSES: '/api/instructor/courses',
    STUDENTS: '/api/instructor/students',
    ANALYTICS: '/api/instructor/analytics',
  },
  ADMIN: {
    USERS: '/api/admin/users',
    COURSES: '/api/admin/courses',
    ANALYTICS: '/api/admin/analytics',
    SETTINGS: '/api/admin/settings',
  },
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  COURSE_LIMIT: 12,
  SEARCH_LIMIT: 20,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SEARCH_HISTORY: 'search_history',
  CART: 'cart',
  WISHLIST: 'wishlist',
  RECENT_COURSES: 'recent_courses',
};

// Theme Configuration
export const THEME = {
  COLORS: {
    PRIMARY: '#3b82f6',
    SECONDARY: '#8b5cf6',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#0ea5e9',
  },
  GRADIENTS: {
    PRIMARY: 'from-blue-600 to-purple-600',
    SUCCESS: 'from-green-500 to-emerald-500',
    WARNING: 'from-orange-500 to-amber-500',
    ERROR: 'from-red-500 to-rose-500',
  },
};

// Validation Rules
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
  TITLE_MAX_LENGTH: 100,
};

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    VIDEO: ['video/mp4', 'video/webm', 'video/avi'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};

// Date and Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  FULL: 'MMMM dd, yyyy HH:mm',
  SHORT: 'MM/dd/yyyy',
  TIME: 'HH:mm',
  ISO: 'yyyy-MM-dd',
};

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: 'Welcome back! 🎉',
    REGISTER: 'Account created successfully! 🎉',
    LOGOUT: 'Logged out successfully 👋',
    ENROLL: 'Successfully enrolled in course! 🎓',
    PROFILE_UPDATE: 'Profile updated successfully ✅',
    PROGRESS_UPDATE: 'Progress updated successfully 📈',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You need to login to access this feature.',
    FORBIDDEN: 'You don\'t have permission to access this resource.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION: 'Please check your input and try again.',
  },
  INFO: {
    LOADING: 'Loading...',
    SAVING: 'Saving changes...',
    PROCESSING: 'Processing your request...',
  },
};

// Feature Flags
export const FEATURES = {
  DARK_MODE: true,
  NOTIFICATIONS: true,
  ANALYTICS: true,
  CHAT_SUPPORT: false,
  OFFLINE_MODE: false,
  SOCIAL_LOGIN: false,
  MULTI_LANGUAGE: false,
};

// Social Media Links
export const SOCIAL_LINKS = APP_CONFIG.socialLinks;

// SEO Configuration
export const SEO = {
  DEFAULT_TITLE: 'EduPlatform - Learn From Expert Instructors',
  TITLE_TEMPLATE: '%s | EduPlatform',
  DEFAULT_DESCRIPTION: 'Join thousands of students learning from industry experts. Master new skills and advance your career with our comprehensive online courses.',
  DEFAULT_KEYWORDS: 'online learning, education, courses, skills development, professional training, certification, e-learning, distance education',
  DEFAULT_OG_IMAGE: '/og-image.png',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://eduplatform.com',
};

// Cache Configuration
export const CACHE = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
