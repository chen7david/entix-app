import { Body, Delete, Get, JsonController, Params, Post, UseBefore } from 'routing-controllers';
import { RolePermissionService } from './role_permission.service';
import { Injectable } from '@utils/typedi.util';
import { validateBody, validateParams } from '@middleware/validation.middleware';
import {
  CreateRolePermissionParamsDto,
  createRolePermissionSchema,
  GetPermissionRolesResultDto,
  GetRolePermissionsResultDto,
  IdDto,
  idSchema,
  RolePermissionIdsDto,
  rolePermissionIdsSchema,
  SuccessResultDto,
} from '@repo/entix-sdk';

@Injectable()
@JsonController('/v1')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get('/roles/:id/permissions')
  @UseBefore(validateParams(idSchema))
  async getRolePermissions(@Params() params: IdDto): Promise<GetRolePermissionsResultDto> {
    return this.rolePermissionService.findRolePermissions({ roleId: params.id });
  }

  @Get('/permissions/:id/roles')
  @UseBefore(validateParams(idSchema))
  async getPermissionRoles(@Params() params: IdDto): Promise<GetPermissionRolesResultDto> {
    return this.rolePermissionService.findPermissionRoles({ permissionId: params.id });
  }

  @Post('/role-permissions')
  @UseBefore(validateBody(createRolePermissionSchema))
  async createRolePermission(@Body() params: CreateRolePermissionParamsDto): Promise<SuccessResultDto> {
    return this.rolePermissionService.createRolePermission(params);
  }

  @Delete('/role-permissions')
  @UseBefore(validateBody(rolePermissionIdsSchema))
  async deleteRolePermission(@Body() params: RolePermissionIdsDto): Promise<SuccessResultDto> {
    return this.rolePermissionService.deleteRolePermission(params);
  }
}
