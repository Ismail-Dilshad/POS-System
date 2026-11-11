import axios, { type AxiosProgressEvent, type AxiosRequestConfig } from 'axios';

/**
 * Extract error message from axios error
 */
export function getErrorMessage(
    error: unknown,
    defaultMessage: string = 'An error occurred',
): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message || defaultMessage;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return defaultMessage;
}

/**
 * Extract error details from axios error
 */
export function getErrorDetails(error: unknown): {
    message?: string;
    errors?: Record<string, string[]>;
} {
    if (axios.isAxiosError(error)) {
        return {
            message: error.response?.data?.message,
            errors: error.response?.data?.errors,
        };
    }
    return {};
}

/**
 * Enhanced API base class with timeout and progress support
 */
export class ApiBase {
    protected baseUrl: string;
    protected defaultTimeout: number;

    constructor(baseUrl: string = '/api', defaultTimeout: number = 60000) {
        this.baseUrl = baseUrl;
        this.defaultTimeout = defaultTimeout;
    }

    /**
     * Make GET request with timeout support
     */
    public async get<T>(
        url: string,
        params?: Record<string, unknown>,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await axios.get(`${this.baseUrl}${url}`, {
            params,
            timeout: this.defaultTimeout,
            ...config,
        });
        return response.data;
    }

    /**
     * Make POST request with timeout and progress support
     */
    public async post<T>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig & {
            onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
            timeout?: number;
        },
    ): Promise<T> {
        const response = await axios.post(`${this.baseUrl}${url}`, data, {
            timeout: config?.timeout || this.defaultTimeout,
            ...config,
        });
        return response.data;
    }

    /**
     * Make PUT request with timeout support
     */
    public async put<T>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await axios.put(`${this.baseUrl}${url}`, data, {
            timeout: this.defaultTimeout,
            ...config,
        });
        return response.data;
    }

    /**
     * Make DELETE request with timeout support
     */
    public async delete<T>(
        url: string,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await axios.delete(`${this.baseUrl}${url}`, {
            timeout: this.defaultTimeout,
            ...config,
        });
        return response.data;
    }

    /**
     * Make PATCH request with timeout support
     */
    public async patch<T>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await axios.patch(`${this.baseUrl}${url}`, data, {
            timeout: this.defaultTimeout,
            ...config,
        });
        return response.data;
    }
}
