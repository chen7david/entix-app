import { accessTokenPayloadSchema, refreshTokenPayloadSchema } from '@schemas/user-auth.schema';
import { z } from 'zod';

export type AccessTokenPayloadResult = z.infer<typeof accessTokenPayloadSchema>;

export type RefreshTokenPayloadResult = z.infer<typeof refreshTokenPayloadSchema>;
