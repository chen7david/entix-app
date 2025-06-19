import { Injectable } from '@utils/typedi.util';
import { RoleRepository } from './role.repository';
import {
  CreateRoleParams,
  CreateRoleResult,
  DeleteRoleParams,
  DeleteRoleResult,
  FindAllRolesResult,
  FindRoleByIdParams,
  FindRoleByIdResult,
  FindRoleByNameResult,
  FindRoleUsersParams,
  FindRoleUsersResult,
  UpdateRoleParams,
  UpdateRoleResult,
} from './role.model';
import { BadRequestError, NotFoundError } from '@repo/api-errors';
import { isEmptyObject } from '@utils/check.util';
import { UserRoleRepository } from '@modules/user_roles/user_role.repository';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  /**
   * Retrieves all roles from the database
   */
  async findAll(): Promise<FindAllRolesResult> {
    return this.roleRepository.findAll();
  }

  /**
   * Finds a role by its ID
   * @param params - Object containing the role ID
   */
  async findById(params: FindRoleByIdParams): Promise<FindRoleByIdResult> {
    const role = await this.roleRepository.findById(params.id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }

  /**
   * Finds a role by its name
   * @param name - Role name
   */
  async findByName(name: string): Promise<FindRoleByNameResult> {
    return this.roleRepository.findByName(name);
  }

  /**
   * Creates a new role
   * @param params - Role creation parameters
   */
  async create(params: CreateRoleParams): Promise<CreateRoleResult> {
    return this.roleRepository.create(params);
  }

  /**
   * Updates an existing role
   * @param id - Role ID
   * @param params - Role update parameters
   */
  async update(id: string, params: UpdateRoleParams): Promise<UpdateRoleResult> {
    if (isEmptyObject(params)) throw new BadRequestError('No fields to update');
    return this.roleRepository.update(id, params);
  }

  /**
   * Deletes a role
   * @param params - Object containing the role ID
   */
  async delete(params: DeleteRoleParams): Promise<DeleteRoleResult> {
    const success = await this.roleRepository.delete(params.id);
    return { success };
  }

  /**
   * Retrieves all users assigned to a role
   * @param params - Object containing the role ID
   */
  async getRoleUsers(params: FindRoleUsersParams): Promise<FindRoleUsersResult> {
    return this.userRoleRepository.findRoleUsers(params.roleId);
  }
}
