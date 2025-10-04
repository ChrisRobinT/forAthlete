import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (email: string, name: string, password: string) =>
    api.post('/api/auth/register', { email, name, password }),

  login: (email: string, password: string) =>
    api.post('/api/auth/login', new URLSearchParams({
      username: email,
      password: password,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),

  me: () => api.get('/api/auth/me'),
};

// Check-in endpoints
export const checkinAPI = {
  create: (data: any) => api.post('/api/checkins', data),
  getToday: () => api.get('/api/checkins/today'),
  getHistory: (limit: number = 30) => api.get(`/api/checkins/history?limit=${limit}`),
};