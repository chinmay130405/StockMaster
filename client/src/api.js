/**
 * API utility for backend communication
 * Handles all HTTP requests with error handling
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Signup new user
 */
export const signup = async (loginId, email, password) => {
  const response = await api.post('/auth/signup', { loginId, email, password });
  return response.data;
};

/**
 * Login user
 */
export const login = async (loginId, password) => {
  const response = await api.post('/auth/login', { loginId, password });
  return response.data;
};

/**
 * Request password reset OTP
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Verify OTP
 */
export const verifyOTP = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

/**
 * Reset password with OTP token
 */
export const resetPassword = async (email, otpToken, newPassword) => {
  const response = await api.post('/auth/reset-password', { email, otpToken, newPassword });
  return response.data;
};

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Store token in localStorage
 */
export const storeToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Get token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

export default api;
