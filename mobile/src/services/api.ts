import axios from 'axios';
import { getToken, removeToken } from './storage';

const API_BASE_URL = 'http://192.168.178.141:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear it
      await removeToken();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    return api.post('/api/auth/login', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: async (email: string, name: string, password: string) => {
    return api.post('/api/auth/register', { email, name, password });
  },
};

export const checkinAPI = {
  create: (data: any) => api.post('/api/checkins', data),
  getToday: () => api.get('/api/checkins/today'),
  getHistory: (limit: number = 30) => api.get(`/api/checkins/history?limit=${limit}`),
};

export const profileAPI = {
  get: () => api.get('/api/profile'),
  create: (data: any) => api.post('/api/profile', data),
  update: (data: any) => api.put('/api/profile', data),
};

export const coachAPI = {
  getDailyRecommendation: () => api.get('/api/coach/daily-recommendation'),
  generateTrainingPlan: (startDate?: string) =>
    api.post('/api/coach/training-plan', startDate ? { start_date: startDate } : {}),
};