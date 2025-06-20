import { JwtService } from '@services/jwt.service';
import { Action, UnauthorizedError } from 'routing-controllers';
import { Container } from 'typedi';

export const authorizationChecker = async (action: Action, required: number[]): Promise<boolean> => {
  const jwtService = Container.get(JwtService);
  const token = action.request.headers['authorization']?.split(' ')[1];

  if (!token) throw new UnauthorizedError('please login to continue');

  const payload = jwtService.verifyAccessToken(token);

  if (!payload) throw new UnauthorizedError('please login to continue');
  if (required.length === 0) return true;
  console.log({ required, payload });
  return required.some(required => payload.permissions.includes(required));
};
