import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    if (error.response?.status === 401 && !/^\/auth\/(login|register|me)$/.test(requestUrl)) {
      window.dispatchEvent(new Event('margin:session-expired'));
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  if (typeof error.response?.data?.error === 'string') return error.response.data.error;
  if (error.response?.status >= 500) return 'The service is temporarily unavailable. Please try again.';
  if (!error.response) return 'Could not reach the service. Check your connection and try again.';
  return error.message || 'Something went wrong. Please try again.';
}

export default api;
