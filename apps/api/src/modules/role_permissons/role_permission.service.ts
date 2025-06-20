import { Injectable } from '@utils/typedi.util';
import { RolePermissionRepository } from './role_permission.repository';
import {
  CreateRolePermissionParams,
  CreateRolePermissionResult,
  DeleteRolePermissionParams,
  DeleteRolePermissionResult,
  FindPermissionRolesParams,
  FindPermissionRolesResult,
  FindRolePermissionsParams,
  FindRolePermissionsResult,
} from './role_permission.model';
import { PermissionRepository } from '@modules/permissions/permission.repository';
import { RoleRepository } from '@modules/roles/role.repository';
import { NotFoundError } from '@repo/api-errors';

@Injectable()
export class RolePermissionService {
  constructor(
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async createRolePermission(params: CreateRolePermissionParams): Promise<CreateRolePermissionResult> {
    const success = await this.rolePermissionRepository.createRolePermission(params);
    return { success };
  }

  async deleteRolePermission(params: DeleteRolePermissionParams): Promise<DeleteRolePermissionResult> {
    const success = await this.rolePermissionRepository.deleteRolePermission(params);
    return { success };
  }

  async findRolePermissions(params: FindRolePermissionsParams): Promise<FindRolePermissionsResult> {
    // Validate role exists
    const role = await this.roleRepository.findById(params.roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return this.rolePermissionRepository.findRolePermissions(params.roleId);
  }

  async findPermissionRoles(params: FindPermissionRolesParams): Promise<FindPermissionRolesResult> {
    // Validate permission exists
    const permission = await this.permissionRepository.findById(params.permissionId);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    return this.rolePermissionRepository.findPermissionRoles(params.permissionId);
  }
}
