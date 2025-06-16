import { JsonController, Get, Param, CurrentUser } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { UserService } from './user.service';
import { User } from './user.model';

@Injectable()
@JsonController('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async getUsers(@CurrentUser() user: User) {
    console.log(user);
    return this.userService.findAll();
  }

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
