import { ApiClient } from './api-client';
import { CreateUserRoleDto, DeleteUserRoleDto } from '../dtos/user_role.dto';
import { SuccessResultDto } from '../dtos/common.dto';

/**
 * API service for user-role assignment operations
 */
export class UserRoleApi {
  private readonly client: ApiClient;
  private readonly basePath = '/v1/user-roles';

  /**
   * Creates a new UserRoleApi instance
   * @param client The API client to use for requests
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Assigns a role to a user
   * @param params User role assignment parameters
   * @returns A promise that resolves to a success result
   */
  async createUserRole(params: CreateUserRoleDto): Promise<SuccessResultDto> {
    return this.client.post<SuccessResultDto>(this.basePath, params);
  }

  /**
   * Removes a role from a user
   * @param params User role removal parameters
   * @returns A promise that resolves to a success result
   */
  async deleteUserRole(params: DeleteUserRoleDto): Promise<SuccessResultDto> {
    return this.client.delete<SuccessResultDto>(`${this.basePath}`, { data: params });
  }
}
