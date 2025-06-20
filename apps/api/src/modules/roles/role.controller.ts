import { Body, Delete, Get, JsonController, Params, Patch, Post, UseBefore } from 'routing-controllers';
import { RoleService } from './role.service';
import { Injectable } from '@utils/typedi.util';
import { validateBody, validateParams } from '@middleware/validation.middleware';
import {
  CreateRoleParamsDto,
  CreateRoleResultDto,
  createRoleSchema,
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
  constructor(private readonly roleService: RoleService) {}

  /**
   * Retrieves all roles
   */
  @Get('/')
  async findAll(): Promise<GetRolesResultDto> {
    return this.roleService.findAll();
  }

  /**
   * Retrieves a role by ID
   * @param params - Object containing the role ID
   */
  @Get('/:id')
  @UseBefore(validateParams(idSchema))
  async findById(@Params() params: IdDto): Promise<GetRoleResultDto> {
    return this.roleService.findById(params);
  }

  /**
   * Creates a new role
   * @param params - Role creation parameters
   */
  @Post('/')
  @UseBefore(validateBody(createRoleSchema))
  async create(@Body() params: CreateRoleParamsDto): Promise<CreateRoleResultDto> {
    return this.roleService.create(params);
  }

  /**
   * Updates an existing role
   * @param params - Object containing the role ID
   * @param body - Role update parameters
   */
  @Patch('/:id')
  @UseBefore(validateParams(idSchema))
  @UseBefore(validateBody(updateRoleSchema))
  async update(@Params() params: IdDto, @Body() body: UpdateRoleParamsDto): Promise<UpdateRoleResultDto> {
    return this.roleService.update(params.id, body);
  }

  /**
   * Deletes a role
   * @param params - Object containing the role ID
   */
  @Delete('/:id')
  @UseBefore(validateParams(idSchema))
  async delete(@Params() params: IdDto): Promise<SuccessResultDto> {
    return this.roleService.delete(params);
  }

  /**
   * Retrieves all users assigned to a role
   * @param params - Object containing the role ID
   */
  @Get('/:id/users')
  @UseBefore(validateParams(idSchema))
  async getRoleUsers(@Params() params: IdDto): Promise<GetRoleUsersResultDto> {
    return this.roleService.getRoleUsers({ roleId: params.id });
  }
}
