/**
 * Centralized API utility for communicating with the Express backend
 * Handles JWT token management, error handling, and HTTP requests
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : `${window.location.origin}/api`);
    
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/') window.location.href = '/';
    throw new Error('Session expired. Please login again.');
  }

  const textBody = await response.text();
  let errorMessage = `Server Error (${response.status})`;
  
  try {
    const errorData = JSON.parse(textBody);
    errorMessage = errorData.message || errorData.error || errorMessage;
  } catch (e) {
    // 如果返回的是 HTML 报错页，截取前 100 字符，否则用状态文本
    errorMessage = textBody.length < 100 ? textBody : `Error ${response.status}: ${response.statusText}`;
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

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Ensure cookies are sent (for sessions)
  });

  if (!response.ok) {
    await handleError(response);
  }

  // Return parsed JSON response if Content-Type is valid
  // const contentType = response.headers.get("content-type");
  // if (contentType && contentType.indexOf("application/json") !== -1) {
  //   return await response.json();
  // }

  // DEBUGGING: Safe JSON parsing
  const text = await response.text();
  try {
    const parsedData = JSON.parse(text);
    // 逻辑找回：如果后端包裹了 .data，自动解包；否则直接返回
    return parsedData.data ? parsedData.data : parsedData;
  } catch (e) {
    console.error("❌ JSON 解析失败，收到非 JSON 数据 (通常是 Vercel 路由返回了 HTML)。预览:", text.substring(0, 300));
    return null; 
  }
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
