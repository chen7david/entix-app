import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from 'axios';
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
  timeoutMs?: number;

  /**
   * Optional function to get the authentication token
   */
  getAuthToken?: () => string | null | undefined;

  /**
   * Optional function to refresh the authentication token
   * @returns A promise that resolves to the new token
   */
  refreshAuthToken?: () => Promise<string>;

  /**
   * Optional function to handle successful token refresh
   * @param newToken The new token
   */
  onTokenRefreshed?: (newToken: string) => void;

  /**
   * Optional function to handle authentication errors
   * @param error The error that occurred
   */
  onAuthenticationError?: (error: unknown) => void;
}

/**
 * Interface for failed request object in axios-auth-refresh
 */
interface AuthRefreshFailedRequest {
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
  private readonly httpClient: AxiosInstance;
  private readonly clientConfig: ApiClientConfig;

  /**
   * Creates a new API client
   * @param config Configuration options for the client
   */
  constructor(config: ApiClientConfig) {
    this.clientConfig = config;
    this.httpClient = this.createHttpClient(config);
    this.setupAuthInterceptors();
    this.setupRefreshTokenInterceptor();
  }

  private createHttpClient(config: ApiClientConfig): AxiosInstance {
    return axios.create({
      baseURL: config.baseURL,
      timeout: config.timeoutMs || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
    });
  }

  private setupAuthInterceptors(): void {
    this.httpClient.interceptors.request.use(
      (requestConfig: InternalAxiosRequestConfig) => {
        const authToken = this.clientConfig.getAuthToken?.();
        if (authToken) {
          requestConfig.headers.Authorization = `Bearer ${authToken}`;
        }
        return requestConfig;
      },
      (error: unknown) => Promise.reject(error),
    );
  }

  private setupRefreshTokenInterceptor(): void {
    if (!this.clientConfig.refreshAuthToken) return;

    const handleTokenRefresh = async (failedRequest: AuthRefreshFailedRequest): Promise<void> => {
      try {
        const newToken = await this.clientConfig.refreshAuthToken!();
        failedRequest.response.config.headers.Authorization = `Bearer ${newToken}`;
        this.clientConfig.onTokenRefreshed?.(newToken);
      } catch (refreshError) {
        this.clientConfig.onAuthenticationError?.(refreshError);
        throw refreshError;
      }
    };

    const refreshOptions: AxiosAuthRefreshOptions = {
      statusCodes: [401],
      shouldRefresh: (error: AxiosError) => {
        const errorData = error.response?.data as { code?: string } | undefined;
        return errorData?.code === 'INVALID_ACCESS_TOKEN';
      },
    };

    createAuthRefreshInterceptor(this.httpClient, handleTokenRefresh, refreshOptions);
  }

  /**
   * Updates the base URL for API requests
   * @param newBaseURL The new base URL
   */
  updateBaseUrl(newBaseURL: string): void {
    this.httpClient.defaults.baseURL = newBaseURL;
  }

  /**
   * Makes a GET request to the specified endpoint
   * @param endpoint The endpoint URL
   * @param requestConfig Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async get<TResponse>(endpoint: string, requestConfig?: AxiosRequestConfig): Promise<TResponse> {
    const response = await this.httpClient.get<TResponse>(endpoint, requestConfig);
    return response.data;
  }

  /**
   * Makes a POST request to the specified endpoint
   * @param endpoint The endpoint URL
   * @param requestBody The data to send
   * @param requestConfig Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async post<TResponse>(
    endpoint: string,
    requestBody?: unknown,
    requestConfig?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.httpClient.post<TResponse>(endpoint, requestBody, requestConfig);
    return response.data;
  }

  /**
   * Makes a PUT request to the specified endpoint
   * @param endpoint The endpoint URL
   * @param requestBody The data to send
   * @param requestConfig Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async put<TResponse>(
    endpoint: string,
    requestBody?: unknown,
    requestConfig?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.httpClient.put<TResponse>(endpoint, requestBody, requestConfig);
    return response.data;
  }

  /**
   * Makes a PATCH request to the specified endpoint
   * @param endpoint The endpoint URL
   * @param requestBody The data to send
   * @param requestConfig Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async patch<TResponse>(
    endpoint: string,
    requestBody?: unknown,
    requestConfig?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.httpClient.patch<TResponse>(endpoint, requestBody, requestConfig);
    return response.data;
  }

  /**
   * Makes a DELETE request to the specified endpoint
   * @param endpoint The endpoint URL
   * @param requestConfig Optional request configuration
   * @returns A promise that resolves to the response data
   */
  async delete<TResponse>(endpoint: string, requestConfig?: AxiosRequestConfig): Promise<TResponse> {
    const response = await this.httpClient.delete<TResponse>(endpoint, requestConfig);
    return response.data;
  }

  /**
   * Gets the underlying axios instance for advanced usage
   * @returns The axios instance
   */
  getUnderlyingHttpClient(): AxiosInstance {
    return this.httpClient;
  }
}
