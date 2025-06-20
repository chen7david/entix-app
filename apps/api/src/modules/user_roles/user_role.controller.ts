import { validateParams } from '@middleware/validation.middleware';
import {
  CreateUserRoleDto,
  createUserRoleSchema,
  DeleteUserRoleDto,
  deleteUserRoleSchema,
  SuccessResultDto,
} from '@repo/entix-sdk';
import { Delete, JsonController, Params, Post, UseBefore } from 'routing-controllers';
import { UserRoleService } from './user_role.service';
import { Injectable } from '@utils/typedi.util';

@Injectable()
@JsonController('/v1/user-roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post('/users/:userId/roles/:roleId')
  @UseBefore(validateParams(createUserRoleSchema))
  async createUserRole(@Params() params: CreateUserRoleDto): Promise<SuccessResultDto> {
    await this.userRoleService.createUserRole(params);
    return { success: true };
  }

  @Delete('/users/:userId/roles/:roleId')
  @UseBefore(validateParams(deleteUserRoleSchema))
  async deleteUserRole(@Params() params: DeleteUserRoleDto): Promise<SuccessResultDto> {
    await this.userRoleService.deleteUserRole(params);
    return { success: true };
  }
}
