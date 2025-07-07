export * from './api-client';
export * from './user-api';
export * from './role-api';
export * from './auth-api';
export * from './permission-api';
export * from './user-role-api';
export * from './role-permission-api';

import { ApiClient, ApiClientConfig } from './api-client';
import { UserApi } from './user-api';
import { RoleApi } from './role-api';
import { AuthApi } from './auth-api';
import { PermissionApi } from './permission-api';
import { UserRoleApi } from './user-role-api';
import { RolePermissionApi } from './role-permission-api';

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
   * The permission API service
   */
  readonly permissions: PermissionApi;

  /**
   * The user-role assignment API service
   */
  readonly userRoles: UserRoleApi;

  /**
   * The role-permission assignment API service
   */
  readonly rolePermissions: RolePermissionApi;

  /**
   * Creates a new EntixApiClient
   * @param config Configuration options for the client
   */
  constructor(config: ApiClientConfig) {
    this.client = new ApiClient(config);

    this.users = new UserApi(this.client);
    this.roles = new RoleApi(this.client);
    this.auth = new AuthApi(this.client);
    this.permissions = new PermissionApi(this.client);
    this.userRoles = new UserRoleApi(this.client);
    this.rolePermissions = new RolePermissionApi(this.client);
  }

  setBaseUrl(baseURL: string): void {
    this.client.updateBaseUrl(baseURL);
  }

  /**
   * Gets the underlying API client
   * @returns The API client
   */
  getApiClient(): ApiClient {
    return this.client;
  }
}
