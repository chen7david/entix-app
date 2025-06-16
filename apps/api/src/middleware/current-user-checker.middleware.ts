import { JwtService } from '@services/jwt.service';
import { Action } from 'routing-controllers';
import { Container } from 'typedi';
import { User } from '@modules/users/user.model';
import { UserService } from '@modules/users/user.service';

export const currentUserChecker = async (action: Action): Promise<User | null> => {
  const jwtService = Container.get(JwtService);
  const userService = Container.get(UserService);
  const authHeader = action.request.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return null;

  try {
    const payload = await jwtService.verifyAccessToken(token);
    const user = await userService.findById(payload.sub);
    return user;
  } catch (err) {
    console.log(err);
    return null;
  }
};
