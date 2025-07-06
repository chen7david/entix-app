import { ApiClient } from './api-client';
import {
  GetPermissionResultDto,
  GetPermissionsResultDto,
  CreatePermissionParamsDto,
  CreatePermissionResultDto,
  UpdatePermissionParamsDto,
  UpdatePermissionResultDto,
} from '../dtos/permission.dto';
import { GetPermissionRolesResultDto } from '../dtos/role_permission.dto';
import { SuccessResultDto } from '../dtos/common.dto';

/**
 * API service for permission-related operations
 */
export class PermissionApi {
  private readonly client: ApiClient;
  private readonly basePath = '/v1/permissions';

  /**
   * Creates a new PermissionApi instance
   * @param client The API client to use for requests
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Retrieves all permissions
   * @returns A promise that resolves to an array of permissions
   */
  async getPermissions(): Promise<GetPermissionsResultDto> {
    return this.client.get<GetPermissionsResultDto>(this.basePath);
  }

  /**
   * Retrieves a permission by ID
   * @param id The permission ID
   * @returns A promise that resolves to the permission
   */
  async getPermission(id: string): Promise<GetPermissionResultDto> {
    return this.client.get<GetPermissionResultDto>(`${this.basePath}/${id}`);
  }

  /**
   * Retrieves all roles assigned to a permission
   * @param id The permission ID
   * @returns A promise that resolves to an array of roles
   */
  async getPermissionRoles(id: string): Promise<GetPermissionRolesResultDto> {
    return this.client.get<GetPermissionRolesResultDto>(`${this.basePath}/${id}/roles`);
  }

  /**
   * Creates a new permission
   * @param params Permission creation parameters
   * @returns A promise that resolves to the created permission
   */
  async createPermission(params: CreatePermissionParamsDto): Promise<CreatePermissionResultDto> {
    return this.client.post<CreatePermissionResultDto>(this.basePath, params);
  }

  /**
   * Updates a permission
   * @param id The permission ID
   * @param params Permission update parameters
   * @returns A promise that resolves to the updated permission
   */
  async updatePermission(id: string, params: UpdatePermissionParamsDto): Promise<UpdatePermissionResultDto> {
    return this.client.patch<UpdatePermissionResultDto>(`${this.basePath}/${id}`, params);
  }

  /**
   * Deletes a permission
   * @param id The permission ID
   * @returns A promise that resolves to a success result
   */
  async deletePermission(id: string): Promise<SuccessResultDto> {
    return this.client.delete<SuccessResultDto>(`${this.basePath}/${id}`);
  }
}
