import axios from 'axios';

const API_URL = 'http://localhost:5002/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
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

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors globally, but be selective about token clearing
    if (error.response && error.response.status === 401) {
      // Check if the error message specifically indicates an invalid token
      // Only clear token for specific token validation failures, not all 401 errors
      if (error.response.data && 
          (error.response.data.message === 'Token is not valid' || 
          error.response.data.message === 'Token has expired')) {
        
        console.warn('Invalid token detected, clearing authentication data');
        
        // Clear auth data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // You could redirect to login page here, but that's better handled 
        // by the components using the useAuth hook's refreshToken function
      }
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Register user
  register: async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw new Error('Registration failed');
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw new Error('Login failed');
    }
  },
};

export default api; 