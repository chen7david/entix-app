import { Injectable } from '@utils/typedi.util';
import { UserService } from './user.service';
import { validateParams } from '@middleware/validation.middleware';
import { JsonController, Get, Params, CurrentUser, Authorized, UseBefore, NotFoundError } from 'routing-controllers';
import { idSchema, IdDto, GetUserRolesResultDto, GetUsersResultDto, GetUserResultDto } from '@repo/entix-sdk';
import { User } from './user.model';

@Injectable()
@JsonController('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieves all users
   * @param user - Current authenticated user
   */
  @Get('/')
  @Authorized([])
  async getUsers(@CurrentUser() user: User): Promise<GetUsersResultDto> {
    console.log({ user }); // TODO: remove this
    return this.userService.findAll();
  }

  /**
   * Retrieves a user by ID
   * @param params - Object containing the user ID
   */
  @Get('/:id')
  @UseBefore(validateParams(idSchema))
  async getUser(@Params() params: IdDto): Promise<GetUserResultDto> {
    const user = await this.userService.findById(params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Retrieves all roles assigned to a user
   * @param params - Object containing the user ID
   */
  @Get('/:id/roles')
  @UseBefore(validateParams(idSchema))
  async getUserRoles(@Params() params: IdDto): Promise<GetUserRolesResultDto> {
    return this.userService.findUserRoles(params.id);
  }
}
