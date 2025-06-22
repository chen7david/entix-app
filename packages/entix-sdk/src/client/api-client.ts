import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import createAuthRefreshInterceptor, { AxiosAuthRefreshOptions } from 'axios-auth-refresh';

/**
 * Configuration options for the API client
 */
export interface ApiClientConfig {
  /**
   * Base URL for API requests
   */
  baseURL: string;

  /**
   * Optional default headers to include with every request
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Optional timeout in milliseconds
   */
  timeout?: number;

  /**
   * Optional function to get the authentication token
   */
  getToken?: () => string | null | undefined;

  /**
   * Optional function to refresh the authentication token
   * @returns A promise that resolves to the new token
   */
  refreshToken?: () => Promise<string>;

  /**
   * Optional function to handle successful token refresh
   * @param token The new token
   */
  onTokenRefreshed?: (token: string) => void;

  /**
   * Optional function to handle authentication errors
   * @param error The error that occurred
   */
  onAuthError?: (error: unknown) => void;
}

/**
 * Interface for failed request object in axios-auth-refresh
 */
interface FailedRequest {
  response: {
    config: {
      headers: {
        Authorization: string;
      };
    };
  };
}

/**
 * A client for making API requests with automatic token refresh
 */
export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  /**
   * Creates a new API client
   * @param config Configuration options for the client
   */
  constructor(config: ApiClientConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.config.getToken) {
          const token = this.config.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error: unknown) => Promise.reject(error),
    );

    // Add refresh token interceptor if refresh function is provided
    if (config.refreshToken) {
      const refreshAuthLogic = async (failedRequest: any): Promise<void> => {
        try {
          const newToken = await this.config.refreshToken!();

          failedRequest.response.config.headers.Authorization = `Bearer ${newToken}`;

          if (this.config.onTokenRefreshed) {
            this.config.onTokenRefreshed(newToken);
          }

          return Promise.resolve();
        } catch (error) {
          if (this.config.onAuthError) {
            this.config.onAuthError(error);
          }
          return Promise.reject(error);
        }
      };

      const options: AxiosAuthRefreshOptions = {
        statusCodes: [401],
        shouldRefresh: (error: any) => {
          return error.response?.data?.code === 'INVALID_ACCESS_TOKEN';
        },
      };

      createAuthRefreshInterceptor(this.client, refreshAuthLogic, options);
    }
  }

  /**
   * Updates the base URL for API requests
   * @param baseURL The new base URL
   */
  setBaseUrl(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Makes a GET request to the specified endpoint
   * @param url The endpoint URL
   * @param config Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Makes a POST request to the specified endpoint
   * @param url The endpoint URL
   * @param data The data to send
   * @param config Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PUT request to the specified endpoint
   * @param url The endpoint URL
   * @param data The data to send
   * @param config Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a PATCH request to the specified endpoint
   * @param url The endpoint URL
   * @param data The data to send
   * @param config Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Makes a DELETE request to the specified endpoint
   * @param url The endpoint URL
   * @param config Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Gets the underlying axios instance for advanced usage
   * @returns The axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}
