import { JsonController, Get, UseBefore, Post, Body } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { createUserSchema, CreateUserDto } from '@repo/entix-sdk';
import { validateBody } from '@middleware/validation.middleware';

@Injectable()
@JsonController('/v1/users')
export class UserController {
  @Get('/')
  getUsers() {
    return [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    ];
  }

  @Post('/')
  @UseBefore(validateBody(createUserSchema))
  createUser(@Body() user: CreateUserDto) {
    return user;
  }
}
