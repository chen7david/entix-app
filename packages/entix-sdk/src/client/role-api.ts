import { ApiClient } from './api-client';
import {
  GetRoleResultDto,
  GetRolesResultDto,
  GetRoleUsersResultDto,
  CreateRoleParamsDto,
  CreateRoleResultDto,
  UpdateRoleParamsDto,
  UpdateRoleResultDto,
} from '../dtos/role.dto';
import { SuccessResultDto } from '../dtos/common.dto';

/**
 * API service for role-related operations
 */
export class RoleApi {
  private readonly client: ApiClient;
  private readonly basePath = '/v1/roles';

  /**
   * Creates a new RoleApi instance
   * @param client The API client to use for requests
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Retrieves all roles
   * @returns A promise that resolves to an array of roles
   */
  async getRoles(): Promise<GetRolesResultDto> {
    return this.client.get<GetRolesResultDto>(this.basePath);
  }

  /**
   * Retrieves a role by ID
   * @param id The role ID
   * @returns A promise that resolves to the role
   */
  async getRole(id: string): Promise<GetRoleResultDto> {
    return this.client.get<GetRoleResultDto>(`${this.basePath}/${id}`);
  }

  /**
   * Retrieves all users assigned to a role
   * @param id The role ID
   * @returns A promise that resolves to an array of users
   */
  async getRoleUsers(id: string): Promise<GetRoleUsersResultDto> {
    return this.client.get<GetRoleUsersResultDto>(`${this.basePath}/${id}/users`);
  }

  /**
   * Creates a new role
   * @param params Role creation parameters
   * @returns A promise that resolves to the created role
   */
  async createRole(params: CreateRoleParamsDto): Promise<CreateRoleResultDto> {
    return this.client.post<CreateRoleResultDto>(this.basePath, params);
  }

  /**
   * Updates a role
   * @param id The role ID
   * @param params Role update parameters
   * @returns A promise that resolves to the updated role
   */
  async updateRole(id: string, params: UpdateRoleParamsDto): Promise<UpdateRoleResultDto> {
    return this.client.patch<UpdateRoleResultDto>(`${this.basePath}/${id}`, params);
  }

  /**
   * Deletes a role
   * @param id The role ID
   * @returns A promise that resolves to a success result
   */
  async deleteRole(id: string): Promise<SuccessResultDto> {
    return this.client.delete<SuccessResultDto>(`${this.basePath}/${id}`);
  }
}
