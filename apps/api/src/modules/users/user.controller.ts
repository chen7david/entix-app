import { Injectable } from '@utils/typedi.util';
import { UserService } from './user.service';
import { validateParams } from '@middleware/validation.middleware';
import { DeleteUserRoleParams } from '@modules/user_roles/user_role.model';
import {
  JsonController,
  Get,
  Params,
  CurrentUser,
  Authorized,
  Post,
  UseBefore,
  Delete,
  NotFoundError,
} from 'routing-controllers';
import {
  CreateUserRoleDto,
  createUserRoleSchema,
  deleteUserRoleSchema,
  SuccessResultDto,
  idSchema,
  IdDto,
  GetUserRolesResultDto,
  GetUsersResultDto,
  GetUserResultDto,
} from '@repo/entix-sdk';
import { User } from './user.model';

@Injectable()
@JsonController('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @Authorized([])
  async getUsers(@CurrentUser() user: User): Promise<GetUsersResultDto> {
    console.log({ user }); // TODO: remove this
    return this.userService.findAll();
  }

  @Get('/:id')
  @UseBefore(validateParams(idSchema))
  async getUser(@Params() params: IdDto): Promise<GetUserResultDto> {
    const user = await this.userService.findById(params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  @Get('/:id/roles')
  @UseBefore(validateParams(idSchema))
  async getUserRoles(@Params() params: IdDto): Promise<GetUserRolesResultDto> {
    return this.userService.findUserRoles(params.id);
  }

  @Post('/:id/roles/:roleId')
  @UseBefore(validateParams(createUserRoleSchema))
  async createUserRole(@Params() params: CreateUserRoleDto): Promise<SuccessResultDto> {
    await this.userService.createUserRole(params);
    return { success: true };
  }

  @Delete('/:id/roles/:roleId')
  @UseBefore(validateParams(deleteUserRoleSchema))
  async deleteUserRole(@Params() params: DeleteUserRoleParams): Promise<SuccessResultDto> {
    await this.userService.deleteUserRole(params);
    return { success: true };
  }
}
