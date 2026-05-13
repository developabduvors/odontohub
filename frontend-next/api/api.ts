import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') return config;
    const token = localStorage.getItem('access_token');
    const isPublic = config.url === '/dentists/' || config.url === '/dentists';
    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const p = window.location.pathname;
      const isAuthPage = /^\/(uz|ru|en|kz)(\/(login|register_pat|register_doc)?)?$/.test(p);
      if (!isAuthPage) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
