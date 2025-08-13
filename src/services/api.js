import axios from 'axios';

// Para debug - puedes remover esto después
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Base URL que se usará:', process.env.REACT_APP_API_URL || 'http://localhost:3000/api');

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    
    return response;
  },
  (error) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid - handled by AuthContext
      localStorage.removeItem('token');
    }
    
    return Promise.reject(error);
  }
);

// API Service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    changePassword: (passwords) => api.put('/auth/change-password', passwords),
    verifyToken: () => api.get('/auth/verify'),
  },

  // Users endpoints
  users: {
    getAll: (params = {}) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
    reactivate: (id) => api.put(`/users/${id}/reactivate`),
    getStats: () => api.get('/users/stats'),
  },

  // Contacts endpoints
  contacts: {
    getAll: (params = {}) => api.get('/contacts', { params }),
    getById: (id) => api.get(`/contacts/${id}`),
    create: (contactData) => api.post('/contacts', contactData),
    update: (id, contactData) => api.put(`/contacts/${id}`, contactData),
    delete: (id) => api.delete(`/contacts/${id}`),
    transfer: (id, transferData) => api.post(`/contacts/${id}/transfer`, transferData),
  },

  // Companies endpoints
  companies: {
    getAll: (params = {}) => api.get('/companies', { params }),
    getById: (id) => api.get(`/companies/${id}`),
    create: (companyData) => api.post('/companies', companyData),
    update: (id, companyData) => api.put(`/companies/${id}`, companyData),
    delete: (id) => api.delete(`/companies/${id}`),
  },

  // Deals endpoints
  deals: {
    getAll: (params = {}) => api.get('/deals', { params }),
    getById: (id) => api.get(`/deals/${id}`),
    create: (dealData) => api.post('/deals', dealData),
    update: (id, dealData) => api.put(`/deals/${id}`, dealData),
    delete: (id) => api.delete(`/deals/${id}`),
    getStats: (params = {}) => api.get('/deals/stats', { params }),
    getPhases: () => api.get('/deals/phases'),
  },

  // Activities endpoints
  activities: {
    getAll: (params = {}) => api.get('/activities', { params }),
    getCalendar: (params = {}) => api.get('/activities/calendar', { params }),
    getById: (id) => api.get(`/activities/${id}`),
    create: (activityData) => api.post('/activities', activityData),
    update: (id, activityData) => api.put(`/activities/${id}`, activityData),
    delete: (id) => api.delete(`/activities/${id}`),
    getTypes: () => api.get('/activities/types'),
    getStats: (params = {}) => api.get('/activities/stats/summary', { params }),
  },

  // Logs endpoints
  logs: {
    getAll: (params = {}) => api.get('/logs', { params }),
    export: (params = {}) => api.get('/logs/export', { params, responseType: 'blob' }),
    getStats: (params = {}) => api.get('/logs/stats', { params }),
    getRecent: (params = {}) => api.get('/logs/recent', { params }),
    getUserLogs: (userId, params = {}) => api.get(`/logs/user/${userId}`, { params }),
    cleanup: (days) => api.delete('/logs/cleanup', { data: { days } }),
    getActions: () => api.get('/logs/actions'),
    getDashboard: (params = {}) => api.get('/logs/dashboard', { params }),
  },

  // Reports endpoints
  reports: {
    getSalesPerformance: (params = {}) => api.get('/reports/sales-performance', { params }),
    getPipelineAnalysis: (params = {}) => api.get('/reports/pipeline-analysis', { params }),
    getActivityMetrics: (params = {}) => api.get('/reports/activity-metrics', { params }),
    getCustomerAnalysis: (params = {}) => api.get('/reports/customer-analysis', { params }),
    getDashboardSummary: (params = {}) => api.get('/reports/dashboard-summary', { params }),
  },

  // System endpoints
  system: {
    health: () => api.get('/health'),
    info: () => api.get('/system/info'),
  },
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: async (response, filename) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Format API errors for display
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.errors) {
      return error.response.data.errors.map(err => err.msg || err.message).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'Ha ocurrido un error inesperado';
  },

  // Check if error is network related
  isNetworkError: (error) => {
    return !error.response && error.code === 'NETWORK_ERROR';
  },

  // Check if error is timeout
  isTimeoutError: (error) => {
    return error.code === 'ECONNABORTED';
  },

  // Retry failed requests
  retryRequest: async (originalRequest, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await api(originalRequest);
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  },

  // Build query string from object
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item));
        } else {
          searchParams.append(key, value);
        }
      }
    });
    
    return searchParams.toString();
  },

  // Parse pagination from response
  parsePagination: (response) => {
    return response.data?.data?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };
  },

  // Extract data from API response
  extractData: (response) => {
    return response.data?.data || response.data;
  },

  // Check if response is successful
  isSuccess: (response) => {
    return response.data?.success !== false && response.status >= 200 && response.status < 300;
  },
};

// Export default api instance
export default api;