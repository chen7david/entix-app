import { Body, Delete, Get, JsonController, Params, Patch, Post, UseBefore } from 'routing-controllers';
import { PermissionService } from './permission.service';
import { Injectable } from '@utils/typedi.util';
import { validateBody, validateParams } from '@middleware/validation.middleware';
import { RolePermissionService } from '@modules/role_permissons/role_permission.service';
import {
  CreatePermissionParamsDto,
  CreatePermissionResultDto,
  createPermissionSchema,
  GetPermissionResultDto,
  GetPermissionRolesResultDto,
  GetPermissionsResultDto,
  IdDto,
  idSchema,
  SuccessResultDto,
  UpdatePermissionParamsDto,
  UpdatePermissionResultDto,
  updatePermissionSchema,
} from '@repo/entix-sdk';

@Injectable()
@JsonController('/v1/permissions')
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  @Get('/')
  async findAll(): Promise<GetPermissionsResultDto> {
    return this.permissionService.findAll();
  }

  @Get('/:id')
  @UseBefore(validateParams(idSchema))
  async findById(@Params() params: IdDto): Promise<GetPermissionResultDto> {
    return this.permissionService.findById(params);
  }

  @Post('/')
  @UseBefore(validateBody(createPermissionSchema))
  async create(@Body() params: CreatePermissionParamsDto): Promise<CreatePermissionResultDto> {
    return this.permissionService.create(params);
  }

  @Patch('/:id')
  @UseBefore(validateParams(idSchema))
  @UseBefore(validateBody(updatePermissionSchema))
  async update(@Params() params: IdDto, @Body() body: UpdatePermissionParamsDto): Promise<UpdatePermissionResultDto> {
    return this.permissionService.update(params.id, body);
  }

  @Delete('/:id')
  @UseBefore(validateParams(idSchema))
  async delete(@Params() params: IdDto): Promise<SuccessResultDto> {
    return this.permissionService.delete(params);
  }

  @Get('/:id/roles')
  @UseBefore(validateParams(idSchema))
  async getPermissionRoles(@Params() params: IdDto): Promise<GetPermissionRolesResultDto> {
    return this.rolePermissionService.findPermissionRoles({ permissionId: params.id });
  }
}
