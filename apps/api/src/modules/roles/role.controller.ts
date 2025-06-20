import { Body, Delete, Get, JsonController, Params, Patch, Post, UseBefore } from 'routing-controllers';
import { RolePermissionService } from '@modules/role_permissons/role_permission.service';
import { RoleService } from './role.service';
import { validateBody, validateParams } from '@middleware/validation.middleware';
import { Injectable } from '@utils/typedi.util';
import {
  CreateRoleParamsDto,
  CreateRoleResultDto,
  createRoleSchema,
  GetRolePermissionsResultDto,
  GetRoleResultDto,
  GetRolesResultDto,
  GetRoleUsersResultDto,
  IdDto,
  idSchema,
  SuccessResultDto,
  UpdateRoleParamsDto,
  UpdateRoleResultDto,
  updateRoleSchema,
} from '@repo/entix-sdk';

@Injectable()
@JsonController('/v1/roles')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  @Get('/')
  async findAll(): Promise<GetRolesResultDto> {
    return this.roleService.findAll();
  }

  @Get('/:id')
  @UseBefore(validateParams(idSchema))
  async findById(@Params() params: IdDto): Promise<GetRoleResultDto> {
    return this.roleService.findById(params);
  }

  @Post('/')
  @UseBefore(validateBody(createRoleSchema))
  async create(@Body() params: CreateRoleParamsDto): Promise<CreateRoleResultDto> {
    return this.roleService.create(params);
  }

  @Patch('/:id')
  @UseBefore(validateParams(idSchema))
  @UseBefore(validateBody(updateRoleSchema))
  async update(@Params() params: IdDto, @Body() body: UpdateRoleParamsDto): Promise<UpdateRoleResultDto> {
    return this.roleService.update(params.id, body);
  }

  @Delete('/:id')
  @UseBefore(validateParams(idSchema))
  async delete(@Params() params: IdDto): Promise<SuccessResultDto> {
    return this.roleService.delete(params);
  }

  @Get('/:id/users')
  @UseBefore(validateParams(idSchema))
  async getRoleUsers(@Params() params: IdDto): Promise<GetRoleUsersResultDto> {
    return this.roleService.getRoleUsers({ roleId: params.id });
  }

  @Get('/:id/permissions')
  @UseBefore(validateParams(idSchema))
  async getRolePermissions(@Params() params: IdDto): Promise<GetRolePermissionsResultDto> {
    return this.rolePermissionService.findRolePermissions({ roleId: params.id });
  }
}
