import axios from 'axios';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      queue.push({ resolve, reject });
    });
  }
  isRefreshing = true;
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token');
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
    const newAccess = res.data.accessToken;
    if (newAccess) localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
    queue.forEach((p) => p.resolve(newAccess));
    queue = [];
    return newAccess;
  } catch (e) {
    queue.forEach((p) => p.reject(e));
    queue = [];
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    throw e;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        }
      } catch (_) {
        // fallthrough to reject
      }
    }
    return Promise.reject(error);
  }
);

export async function get(path, config) {
  const { data } = await api.get(path, config);
  return data;
}

export async function post(path, body, config) {
  const { data } = await api.post(path, body, config);
  return data;
}

export default api;


