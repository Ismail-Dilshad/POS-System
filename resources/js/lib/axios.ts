import { currentPortal, portalPath } from './portal';
import axios from 'axios';

// Configure axios for Laravel session authentication
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    timeout: 300000, // 5 minutes - matches PHP execution timeout
    headers: {
        'X-Requested-With': 'XMLhttpsRequest',
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

// Add CSRF token to requests
api.interceptors.request.use((config) => {
    const portal = currentPortal();
    config.headers['X-Portal'] = portal;
    config.xsrfCookieName = 'XSRF-TOKEN-' + portal;
    // Get CSRF token from meta tag
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
});

// Handle authentication errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login if unauthorized
            window.location.href = portalPath('login');
        }
        return Promise.reject(error);
    },
);

export default api;
