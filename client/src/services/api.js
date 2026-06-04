import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
});

// Request interceptor — attach token to every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('sl_token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  err => Promise.reject(err)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;