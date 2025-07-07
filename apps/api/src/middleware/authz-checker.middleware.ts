import { JwtService } from '@services/jwt.service';
import { Action } from 'routing-controllers';
import { UnauthorizedError } from '@repo/api-errors';
import { Container } from 'typedi';

export const authorizationChecker = async (action: Action, required: number[]): Promise<boolean> => {
  const jwtService = Container.get(JwtService);
  const token = jwtService.removeBearerPrefix(action.request.headers['authorization']);

  const payload = jwtService.verifyAccessToken(token);

  if (!payload)
    throw new UnauthorizedError({
      message: 'please login to continue',
      code: 'UNAUTHORIZED',
    });

  if (required.length === 0) return true;

  return required.some(required => payload.permissionCodes.includes(required));
};
