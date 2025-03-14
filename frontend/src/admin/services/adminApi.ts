import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

// Create admin API instance
const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized responses
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirect to login page on authentication errors
      window.location.href = '/login';
    } else if (error.response && error.response.status === 403) {
      // Handle forbidden errors (not an admin)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Test administration
export const testService = {
  // Get all tests
  getAllTests: async () => {
    try {
      const response = await adminApi.get('/tests');
      return response.data;
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw error;
    }
  },

  // Get test by ID
  getTestById: async (id: number) => {
    try {
      const response = await adminApi.get(`/tests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching test ${id}:`, error);
      throw error;
    }
  },

  // Create new test
  createTest: async (testData: any) => {
    try {
      const response = await adminApi.post('/tests', testData);
      return response.data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },

  // Update test
  updateTest: async (id: number, testData: any) => {
    try {
      const response = await adminApi.put(`/tests/${id}`, testData);
      return response.data;
    } catch (error) {
      console.error(`Error updating test ${id}:`, error);
      throw error;
    }
  },

  // Delete test
  deleteTest: async (id: number) => {
    try {
      const response = await adminApi.delete(`/tests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting test ${id}:`, error);
      throw error;
    }
  },
};

// User administration
export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await adminApi.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: number) => {
    try {
      const response = await adminApi.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  // Toggle admin status
  toggleAdminStatus: async (id: number) => {
    try {
      const response = await adminApi.patch(`/users/${id}/toggle-admin`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling admin status for user ${id}:`, error);
      throw error;
    }
  },
};

// Dashboard statistics
export const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      // Try the /dashboard endpoint first
      try {
        const response = await adminApi.get('/dashboard');
        return response.data;
      } catch (error) {
        console.log('Error with /dashboard endpoint, trying /stats instead');
        // If /dashboard fails, try /stats
        const response = await adminApi.get('/stats');
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw error;
    }
  },
};

export default {
  testService,
  userService,
  dashboardService,
}; 