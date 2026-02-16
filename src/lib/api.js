/**
 * Centralized API utility for communicating with the Express backend
 * Handles JWT token management, error handling, and HTTP requests
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5002/api' : 'https://asset-tracker-pern-v1.vercel.app/api');

console.log("🚀 Current API Base URL:", API_BASE_URL); // Log for debugging

/**
 * Get the JWT token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Handle API errors and redirect on 401
 */
const handleError = async (response) => {
  if (response.status === 401) {
    // Unauthorized - clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('Session expired. Please login again.');
  }

  // Try to parse error message from response
  let errorMessage = 'An error occurred';
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
  } catch (e) {
    // If response is not JSON, use status text
    errorMessage = response.statusText || errorMessage;
  }

  throw new Error(errorMessage);
};

/**
 * Make a fetch request with automatic token injection
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Ensure cookies are sent (for sessions)
  });

  if (!response.ok) {
    await handleError(response);
  }

  // Return parsed JSON response
  return await response.json();
};

/**
 * API methods
 */
const api = {
  /**
   * GET request
   */
  get: async (endpoint) => {
    return fetchWithAuth(endpoint, {
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  post: async (endpoint, data) => {
    return fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  put: async (endpoint, data) => {
    return fetchWithAuth(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  delete: async (endpoint) => {
    return fetchWithAuth(endpoint, {
      method: 'DELETE',
    });
  },

  /**
   * Update User Profile
   */
  updateProfile: async (data) => {
    return fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Admin API
   */
  getAdminStats: async () => {
    return fetchWithAuth('/admin/stats', { method: 'GET' });
  },

  getUsers: async () => {
    return fetchWithAuth('/admin/users', { method: 'GET' });
  },

  deleteUser: async (id) => {
    return fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' });
  },

  toggleSubscription: async (id, status) => {
    return fetchWithAuth(`/admin/users/${id}/subscription`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
};

export default api;
