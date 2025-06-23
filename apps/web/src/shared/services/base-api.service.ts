import { apiClient } from '../utils';
import type { ErrorResponse } from '../types';

/**
 * Base API Service utilities
 * Provides common functionality for all API services
 */
export const baseApiService = {
  client: apiClient,

  /**
   * Handles API errors consistently across all services
   */
  handleError(error: ErrorResponse, defaultMessage: string): never {
    const errorMessage = error.response?.data?.message || defaultMessage;
    console.error('API Error:', errorMessage);
    throw error;
  },

  /**
   * Creates a standard API service configuration
   */
  createService(serviceName: string) {
    return {
      client: this.client,
      name: serviceName,
      handleError: this.handleError,
    };
  },
};
