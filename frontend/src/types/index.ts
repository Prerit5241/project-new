// User and Authentication Types
export interface User {
  _id: number;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'instructor';
  enrolledCourses?: Enrollment[];
  profile?: UserProfile;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  timezone: string;
  theme?: 'light' | 'dark' | 'system';
}

// Course Related Types
export interface Course {
  _id: number;
  title: string;
  description: string;
  price: number;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'inactive' | 'draft';
  instructor: Instructor;
  category: Category;
  subCategory?: SubCategory;
  modules: Module[];
  enrollmentCount: number;
  ratings: CourseRatings;
  tags?: string[];
  thumbnail?: string;
  previewVideo?: string;
  prerequisites?: string[];
  learningOutcomes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  _id: number;
  name: string;
  email: string;
  profile?: {
    avatar?: string;
    bio?: string;
    expertise?: string[];
    experience?: number;
    rating?: number;
    totalStudents?: number;
  };
}

export interface Category {
  _id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  courseCount?: number;
}

export interface SubCategory {
  _id: number;
  name: string;
  slug: string;
  categoryId: number;
  description?: string;
}

export interface Module {
  _id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  duration?: number;
  isPreview?: boolean;
}

export interface Lesson {
  _id?: string;
  title: string;
  contentType: 'video' | 'text' | 'quiz' | 'assignment';
  duration: number;
  content: string;
  order: number;
  isPreview?: boolean;
  resources?: Resource[];
  quiz?: Quiz;
}

export interface Resource {
  name: string;
  type: 'pdf' | 'doc' | 'link' | 'image';
  url: string;
  size?: number;
}

export interface Quiz {
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  attempts?: number;
}

export interface QuizQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
}

export interface CourseRatings {
  average: number;
  count: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Enrollment Related Types
export interface Enrollment {
  courseId: number;
  enrolledAt: string;
  progress: number;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  price: number;
  completedLessons: CompletedLesson[];
  lastAccessed: string;
  startedAt?: string;
  completedAt?: string;
  certificate?: Certificate;
  notes?: string;
}

export interface CompletedLesson {
  moduleIndex: number;
  lessonIndex: number;
  completedAt: string;
  timeSpent?: number;
  score?: number;
}

export interface Certificate {
  id: string;
  issuedAt: string;
  certificateUrl: string;
  verificationCode: string;
}

// API Related Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Statistics Types
export interface EnrollmentStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  paused: number;
  averageProgress: number;
  completionRate: number;
  totalTimeSpent?: number;
  certificatesEarned?: number;
}

export interface DashboardStats {
  enrollmentStats: EnrollmentStats;
  recentActivity: Activity[];
  upcomingDeadlines: Deadline[];
  achievements: Achievement[];
}

export interface Activity {
  id: string;
  type: 'enrollment' | 'completion' | 'progress' | 'certificate';
  title: string;
  description: string;
  timestamp: string;
  courseId?: number;
  courseTitle?: string;
}

export interface Deadline {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  type: 'assignment' | 'quiz' | 'project';
  priority: 'low' | 'medium' | 'high';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'course_completion' | 'streak' | 'quiz_master' | 'early_bird';
  earnedAt: string;
  badge?: string;
}

// Authentication Context Type
export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  checkAuthStatus: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'instructor';
  agreeToTerms: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Filter and Search Types
export interface CourseFilters {
  category?: string;
  subCategory?: string;
  level?: string;
  priceRange?: [number, number];
  rating?: number;
  duration?: string;
  language?: string;
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating' | 'popular';
}

export interface SearchParams {
  query?: string;
  filters?: CourseFilters;
  page?: number;
  limit?: number;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ThemeMode = 'light' | 'dark' | 'system';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
