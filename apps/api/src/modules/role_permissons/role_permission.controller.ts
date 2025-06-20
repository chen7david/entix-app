import { Delete, JsonController, Params, Post, UseBefore } from 'routing-controllers';
import { RolePermissionService } from './role_permission.service';
import { Injectable } from '@utils/typedi.util';
import { validateParams } from '@middleware/validation.middleware';
import {
  CreateRolePermissionParamsDto,
  createRolePermissionSchema,
  RolePermissionIdsDto,
  rolePermissionIdsSchema,
  SuccessResultDto,
} from '@repo/entix-sdk';

@Injectable()
@JsonController('/v1/role-permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post('/roles/:roleId/permissions/:permissionId')
  @UseBefore(validateParams(createRolePermissionSchema))
  async createRolePermission(@Params() params: CreateRolePermissionParamsDto): Promise<SuccessResultDto> {
    return this.rolePermissionService.createRolePermission(params);
  }

  @Delete('/roles/:roleId/permissions/:permissionId')
  @UseBefore(validateParams(rolePermissionIdsSchema))
  async deleteRolePermission(@Params() params: RolePermissionIdsDto): Promise<SuccessResultDto> {
    return this.rolePermissionService.deleteRolePermission(params);
  }
}
