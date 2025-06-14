import { JsonController, Get } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';

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
}
