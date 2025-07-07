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
    return this.permissionRepository.create(params);
  }

  async update(id: string, params: UpdatePermissionParams): Promise<UpdatePermissionResult> {
    if (isEmptyObject(params)) {
      throw new BadRequestError('No fields to update');
    }
    return this.permissionRepository.update(id, params);
  }

  async delete(params: DeletePermissionParams): Promise<DeletePermissionResult> {
    const success = await this.permissionRepository.delete(params.id);
    return { success };
  }
}
