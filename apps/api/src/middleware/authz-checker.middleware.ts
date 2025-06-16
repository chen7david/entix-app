import { JwtService } from '@services/jwt.service';
import { Action, UnauthorizedError } from 'routing-controllers';
import { Container } from 'typedi';

export const authorizationChecker = async (action: Action, roles: string[]): Promise<boolean> => {
  const jwtService = Container.get(JwtService);
  const token = action.request.headers['authorization']?.split(' ')[1];

  if (!token) return false;

  const payload = jwtService.verifyAccessToken(token);

  if (!payload) throw new UnauthorizedError('Unauthorized');
  if (roles.length === 0) return true;

  return roles.some(role => payload.roles.includes(role));
};
