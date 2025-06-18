import { Injectable } from '@utils/typedi.util';
import { RoleRepository } from './role.repository';
import { IdDto, IdParams, Role } from '@repo/entix-sdk';
import { CreateRoleParams, DeleteRoleResult, UpdateRoleParams } from './role.model';
import { NotFoundError } from 'routing-controllers';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

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

  async update(id: string, role: UpdateRoleParams): Promise<Role> {
    return this.roleRepository.update(id, role);
  }

  async delete(params: IdParams): Promise<DeleteRoleResult> {
    return this.roleRepository.delete(params.id);
  }
}
