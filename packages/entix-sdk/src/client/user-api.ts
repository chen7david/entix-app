import { ApiClient } from './api-client';
import {
  GetUserResultDto,
  GetUsersResultDto,
  GetUserRolesResultDto,
  CreateUserParamsDto,
  CreateUserResultDto,
  UpdateUserParamsDto,
  UpdateUserResultDto,
} from '../dtos/user.dto';

/**
 * API service for user-related operations
 */
export class UserApi {
  private readonly client: ApiClient;
  private readonly basePath = '/v1/users';

  /**
   * Creates a new UserApi instance
   * @param client The API client to use for requests
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Retrieves all users
   * @returns A promise that resolves to an array of users
   */
  async getUsers(): Promise<GetUsersResultDto> {
    return this.client.get<GetUsersResultDto>(this.basePath);
  }

  /**
   * Retrieves a user by ID
   * @param id The user ID
   * @returns A promise that resolves to the user
   */
  async getUser(id: string): Promise<GetUserResultDto> {
    return this.client.get<GetUserResultDto>(`${this.basePath}/${id}`);
  }

  /**
   * Retrieves all roles assigned to a user
   * @param id The user ID
   * @returns A promise that resolves to an array of roles
   */
  async getUserRoles(id: string): Promise<GetUserRolesResultDto> {
    return this.client.get<GetUserRolesResultDto>(`${this.basePath}/${id}/roles`);
  }

  /**
   * Creates a new user
   * @param params User creation parameters
   * @returns A promise that resolves to the created user
   */
  async createUser(params: CreateUserParamsDto): Promise<CreateUserResultDto> {
    return this.client.post<CreateUserResultDto>(this.basePath, params);
  }

  /**
   * Updates a user
   * @param id The user ID
   * @param params User update parameters
   * @returns A promise that resolves to the updated user
   */
  async updateUser(id: string, params: UpdateUserParamsDto): Promise<UpdateUserResultDto> {
    return this.client.patch<UpdateUserResultDto>(`${this.basePath}/${id}`, params);
  }
}
