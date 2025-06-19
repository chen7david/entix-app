export * from './api-client';
export * from './user-api';
export * from './role-api';
export * from './auth-api';

import { ApiClient, ApiClientConfig } from './api-client';
import { UserApi } from './user-api';
import { RoleApi } from './role-api';
import { AuthApi } from './auth-api';

/**
 * Main API client that provides access to all API services
 */
export class EntixApiClient {
  private readonly client: ApiClient;

  /**
   * The user API service
   */
  readonly users: UserApi;

  /**
   * The role API service
   */
  readonly roles: RoleApi;

  /**
   * The authentication API service
   */
  readonly auth: AuthApi;

  /**
   * Creates a new EntixApiClient
   * @param config Configuration options for the client
   */
  constructor(config: ApiClientConfig) {
    this.client = new ApiClient(config);

    this.users = new UserApi(this.client);
    this.roles = new RoleApi(this.client);
    this.auth = new AuthApi(this.client);
  }

  /**
   * Updates the base URL for API requests
   * @param baseURL The new base URL
   */
  setBaseUrl(baseURL: string): void {
    this.client.setBaseUrl(baseURL);
  }

  /**
   * Gets the underlying API client
   * @returns The API client
   */
  getApiClient(): ApiClient {
    return this.client;
  }
}
