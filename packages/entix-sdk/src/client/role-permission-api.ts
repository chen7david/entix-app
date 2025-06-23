import { ApiClient } from './api-client';
import { CreateRolePermissionParamsDto, RolePermissionIdsDto } from '../dtos/role_permission.dto';
import { SuccessResultDto } from '../dtos/common.dto';

/**
 * API service for role-permission assignment operations
 */
export class RolePermissionApi {
  private readonly client: ApiClient;
  private readonly basePath = '/v1/role-permissions';

  /**
   * Creates a new RolePermissionApi instance
   * @param client The API client to use for requests
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Assigns a permission to a role
   * @param params Role permission assignment parameters
   * @returns A promise that resolves to a success result
   */
  async createRolePermission(params: CreateRolePermissionParamsDto): Promise<SuccessResultDto> {
    return this.client.post<SuccessResultDto>(
      `${this.basePath}/roles/${params.roleId}/permissions/${params.permissionId}`,
      {},
    );
  }

  /**
   * Removes a permission from a role
   * @param params Role permission removal parameters
   * @returns A promise that resolves to a success result
   */
  async deleteRolePermission(params: RolePermissionIdsDto): Promise<SuccessResultDto> {
    return this.client.delete<SuccessResultDto>(
      `${this.basePath}/roles/${params.roleId}/permissions/${params.permissionId}`,
    );
  }
}
