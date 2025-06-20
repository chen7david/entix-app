import { Injectable } from '@utils/typedi.util';
import { PermissionRepository } from './permission.repository';
import {
  CreatePermissionParams,
  CreatePermissionResult,
  DeletePermissionParams,
  DeletePermissionResult,
  FindAllPermissionsResult,
  FindPermissionByIdParams,
  FindPermissionByIdResult,
  UpdatePermissionParams,
  UpdatePermissionResult,
} from './permission.model';
import { BadRequestError, NotFoundError } from '@repo/api-errors';
import { isEmptyObject } from '@utils/check.util';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async findAll(): Promise<FindAllPermissionsResult> {
    return this.permissionRepository.findAll();
  }

  async findById(params: FindPermissionByIdParams): Promise<FindPermissionByIdResult> {
    const permission = await this.permissionRepository.findById(params.id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }
    return permission;
  }

  async create(params: CreatePermissionParams): Promise<CreatePermissionResult> {
    const existingByName = await this.permissionRepository.findByName(params.name);
    if (existingByName) {
      throw new BadRequestError('Permission with this name already exists');
    }

    const existingByCode = await this.permissionRepository.findByPermissionCode(params.permissionCode);
    if (existingByCode) {
      throw new BadRequestError('Permission with this code already exists');
    }

    return this.permissionRepository.create(params);
  }

  async update(id: string, params: UpdatePermissionParams): Promise<UpdatePermissionResult> {
    if (isEmptyObject(params)) {
      throw new BadRequestError('No fields to update');
    }

    if (params.name) {
      const existingByName = await this.permissionRepository.findByName(params.name);
      if (existingByName && existingByName.id !== id) {
        throw new BadRequestError('Permission with this name already exists');
      }
    }

    if (params.permissionCode) {
      const existingByCode = await this.permissionRepository.findByPermissionCode(params.permissionCode);
      if (existingByCode && existingByCode.id !== id) {
        throw new BadRequestError('Permission with this code already exists');
      }
    }

    return this.permissionRepository.update(id, params);
  }

  async delete(params: DeletePermissionParams): Promise<DeletePermissionResult> {
    const success = await this.permissionRepository.delete(params.id);
    return { success };
  }
}
