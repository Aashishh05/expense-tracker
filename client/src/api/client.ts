import axios from 'axios';

export const TOKEN_KEY = 'et_token';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    const isAuthAttempt = url.endsWith('/auth/login') || url.endsWith('/auth/register');

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default client;
