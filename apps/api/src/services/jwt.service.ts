import { Injectable } from '@utils/typedi.util';
import { ConfigService } from '@services/config.service';
import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { StringValue } from 'ms';
import {
  AccessTokenPayloadResult,
  accessTokenPayloadSchema,
  RefreshTokenPayloadResult,
  refreshTokenPayloadSchema,
} from '@repo/entix-sdk';
import { UnauthorizedError } from '@repo/api-errors';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  private sign(
    payload: Record<string, unknown>,
    secret: string,
    expiresIn: StringValue,
    algorithm: SignOptions['algorithm'] = 'HS256', // Default to HMAC SHA256
  ): string {
    const options: SignOptions = { expiresIn, algorithm };
    return jwt.sign(payload, secret, options);
  }

  private verify<T = JwtPayload>(token: string, secret: string, options: VerifyOptions = {}): T {
    return jwt.verify(token, secret, options) as T;
  }

  private decode<T = null | string | JwtPayload>(token: string, options?: jwt.DecodeOptions): T {
    return jwt.decode(token, options) as T;
  }

  signAccessToken(payload: Record<string, unknown>) {
    return this.sign(
      payload,
      this.configService.env.JWT_ACCESS_TOKEN_SECRET,
      this.configService.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME as StringValue,
    );
  }

  signRefreshToken(payload: Record<string, unknown>) {
    return this.sign(
      payload,
      this.configService.env.JWT_REFRESH_TOKEN_SECRET,
      this.configService.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME as StringValue,
    );
  }

  verifyAccessToken(token: string): AccessTokenPayloadResult {
    try {
      const payload = this.verify<AccessTokenPayloadResult>(token, this.configService.env.JWT_ACCESS_TOKEN_SECRET);
      return accessTokenPayloadSchema.parse(payload);
    } catch (error) {
      throw new UnauthorizedError({
        message: 'Invalid access token',
        code: 'INVALID_ACCESS_TOKEN',
      });
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayloadResult {
    try {
      const payload = this.verify<RefreshTokenPayloadResult>(token, this.configService.env.JWT_REFRESH_TOKEN_SECRET);
      return refreshTokenPayloadSchema.parse(payload);
    } catch (error) {
      throw new UnauthorizedError({
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  decodeToken<T = null | string | JwtPayload>(token: string): T {
    return this.decode<T>(token);
  }
}
