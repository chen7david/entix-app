import { Body, Delete, JsonController, Post, UseBefore } from 'routing-controllers';
import { RolePermissionService } from './role_permission.service';
import { Injectable } from '@utils/typedi.util';
import { validateBody } from '@middleware/validation.middleware';
import {
  CreateRolePermissionParamsDto,
  createRolePermissionSchema,
  RolePermissionIdsDto,
  rolePermissionIdsSchema,
  SuccessResultDto,
} from '@repo/entix-sdk';

@Injectable()
@JsonController('/v1')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

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
