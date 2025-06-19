import { Injectable } from '@utils/typedi.util';
import { RoleRepository } from './role.repository';
import { IdDto, IdParams, Role, SuccessResult } from '@repo/entix-sdk';
import { CreateRoleParams, UpdateRoleParams } from './role.model';
import { BadRequestError, NotFoundError } from '@repo/api-errors';
import { isEmptyObject } from '@utils/check.util';
import { UserRoleRepository } from '@modules/user_roles/user_role.repository';
import { CreateUserRoleParams } from '@modules/users/user.model';
import { DeleteUserRoleParams } from '@modules/user_roles/user_role.model';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  async findById(params: IdDto): Promise<Role> {
    const role = await this.roleRepository.findById(params.id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }

  async findByName(name: string): Promise<Role | undefined> {
    return this.roleRepository.findByName(name);
  }

  async create(params: CreateRoleParams): Promise<Role> {
    return this.roleRepository.create(params);
  }

  async update(id: string, params: UpdateRoleParams): Promise<Role> {
    if (isEmptyObject(params)) throw new BadRequestError('No fields to update');
    return this.roleRepository.update(id, params);
  }

  async delete(params: IdParams): Promise<SuccessResult> {
    const success = await this.roleRepository.delete(params.id);
    return { success };
  }

  async createUserRole(params: CreateUserRoleParams): Promise<SuccessResult> {
    const success = await this.userRoleRepository.createUserRole(params);
    return { success };
  }

  async deleteUserRole(params: DeleteUserRoleParams): Promise<SuccessResult> {
    const success = await this.userRoleRepository.deleteUserRole(params);
    return { success };
  }
}
