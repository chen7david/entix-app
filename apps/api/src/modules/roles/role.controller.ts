import { Body, Delete, Get, JsonController, Params, Patch, Post, UseBefore } from 'routing-controllers';
import { RoleService } from './role.service';
import { Injectable } from '@utils/typedi.util';
import { validateBody, validateParams } from '@middleware/validation.middleware';
import {
  CreateRoleDto,
  CreateRoleResultDto,
  createRoleSchema,
  GetRoleResultDto,
  GetRolesResultDto,
  GetRoleUsersResultDto,
  IdDto,
  idSchema,
  SuccessResultDto,
  UpdateRoleDto,
  UpdateRoleResultDto,
  updateRoleSchema,
} from '@repo/entix-sdk';

@Injectable()
@JsonController('/v1/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

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
  async create(@Body() params: CreateRoleDto): Promise<CreateRoleResultDto> {
    return this.roleService.create(params);
  }

  @Patch('/:id')
  @UseBefore(validateParams(idSchema))
  @UseBefore(validateBody(updateRoleSchema))
  async update(@Params() params: IdDto, @Body() body: UpdateRoleDto): Promise<UpdateRoleResultDto> {
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
    return this.roleService.getRoleUsers(params);
  }
}
