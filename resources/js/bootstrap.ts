import { currentPortal, portalPath } from './lib/portal';
import axios from 'axios';

// Get CSRF token from meta tag
function getCSRFToken(): string | null {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    return token ? (token as HTMLMetaElement).content : null;
}

// Set up axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.withCredentials = true;
axios.defaults.timeout = 300000; // 5 minutes - matches PHP execution timeout

// Use the application origin, including its development port.
axios.defaults.baseURL = window.location.origin;

// Simple request interceptor - no auth waiting logic
axios.interceptors.request.use(
    (config) => {
        const portal = currentPortal();
        config.headers['X-Portal'] = portal;
        config.xsrfCookieName = 'XSRF-TOKEN-' + portal;
        const token = getCSRFToken();
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Handle responses and errors
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 419) {
            // CSRF token mismatch - reload page to get fresh token
            console.warn('CSRF token mismatch - reloading page');
            window.location.reload();
            return;
        }

        if (error.response?.status === 401) {
            // Unauthorized - redirect to login
            console.warn('Unauthorized access - redirecting to login');
            window.location.href = portalPath('login');
            return;
        }

        return Promise.reject(error);
    },
);

export default axios;
