// Authentication utility functions

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The token or null if not found
 */
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The token to store
 */
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Get the user role from localStorage or user object
 * @returns {string} The user role (default: 'student')
 */
export const getRole = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.role || 'student';
      } catch (error) {
        console.error('Error parsing user data:', error);
        return 'student';
      }
    }
  }
  return 'student';
};

/**
 * Get the current user from localStorage
 * @returns {Object|null} The user object or null if not found
 */
export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
  }
  return null;
};

/**
 * Set the current user in localStorage
 * @param {Object} user - The user object to store
 */
export const setCurrentUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  return !!(token && user);
};

/**
 * Check if the user has a specific role
 * @param {string} role - The role to check
 * @returns {boolean} True if user has the role, false otherwise
 */
export const hasRole = (role) => {
  const userRole = getRole();
  return userRole === role;
};

/**
 * Get authorization headers for API calls
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  removeToken();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('wishlist');
  }
};
