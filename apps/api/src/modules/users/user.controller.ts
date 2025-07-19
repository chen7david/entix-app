import { Injectable } from '@utils/typedi.util';
import { UserService } from './user.service';
import { validateParams } from '@middleware/validation.middleware';
import { JsonController, Get, Params, CurrentUser, Authorized, UseBefore, NotFoundError } from 'routing-controllers';
import { idSchema, GetUsersResultDto, PermissionCode } from '@repo/entix-sdk';
import type { IdDto, GetUserRolesResultDto, GetUserResultDto } from '@repo/entix-sdk';
import { type User } from './user.model';

@Injectable()
@JsonController('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @Authorized([PermissionCode.GET_USERS])
  async getUsers(): Promise<GetUsersResultDto> {
    return this.userService.findAll();
  }

  @Get('/me')
  @Authorized([PermissionCode.GET_USERS])
  async getMe(@CurrentUser() user: User): Promise<GetUserResultDto> {
    return user;
  }

  @Get('/:id')
  @Authorized([PermissionCode.GET_USER])
  @UseBefore(validateParams(idSchema))
  async getUser(@Params() params: IdDto): Promise<GetUserResultDto> {
    const user = await this.userService.findById(params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  @Get('/:id/roles')
  @Authorized([PermissionCode.GET_USER_ROLES])
  @UseBefore(validateParams(idSchema))
  async getUserRoles(@Params() params: IdDto): Promise<GetUserRolesResultDto> {
    return this.userService.findUserRoles(params.id);
  }
}
