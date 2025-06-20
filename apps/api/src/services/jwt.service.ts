import { Injectable } from '@utils/typedi.util';
import { ConfigService } from '@services/config.service';
import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { AccessTokenPayloadResult, accessTokenPayloadSchema, RefreshTokenPayloadResult } from '@repo/entix-sdk';

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
    const payload = this.verify<AccessTokenPayloadResult>(token, this.configService.env.JWT_ACCESS_TOKEN_SECRET);
    console.log({ payload });
    return accessTokenPayloadSchema.parse(payload);
  }

  verifyRefreshToken(token: string): RefreshTokenPayloadResult {
    return this.verify<RefreshTokenPayloadResult>(token, this.configService.env.JWT_REFRESH_TOKEN_SECRET);
  }

  decodeToken<T = null | string | JwtPayload>(token: string): T {
    return this.decode<T>(token);
  }
}
