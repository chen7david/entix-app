import { JsonController, Get, Param } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { UserService } from './user.service';

@Injectable()
@JsonController('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  async getUsers() {
    return this.userService.findAll();
  }

  @Get('/:id')
  async getUser(@Param('id') id: number) {
    return this.userService.findById(id);
  }
}
