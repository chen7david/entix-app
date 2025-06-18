import { CognitoService } from '@services/cognito/cognito.service';
import { Injectable } from '@utils/typedi.util';
import { LogoutDto, SuccessResultDto, SignUpDto, SignUpResultDto } from '@repo/entix-sdk';
import { LoginDto, LoginResultDto } from 'node_modules/@repo/entix-sdk/dist/esm/dtos/user-auth.dto';
import { UserService } from '@modules/users/user.service';
import { JwtService } from '@services/jwt.service';
import { CognitoAccessTokenPayload } from '@services/cognito/cognito.model';
import { InternalError } from '@repo/api-errors';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly cognitoService: CognitoService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(params: SignUpDto): Promise<SignUpResultDto> {
    const result = await this.cognitoService.signUp(params);

    const user = await this.userService.createUser({
      sub: result.userSub,
      email: params.email,
      username: params.username,
    });
    return user;
  }

  async login(params: LoginDto): Promise<LoginResultDto> {
    const { accessToken } = await this.cognitoService.login(params);
    const { sub } = this.jwtService.decodeToken<CognitoAccessTokenPayload>(accessToken);

    const user = await this.userService.findByCognitoSub(sub);

    if (!user) {
      throw new InternalError('Cognito user not found in core database');
    }

    /**
     * We use Cognito only for authentication.
     * After a successful login, we log the user out
     * to prevent session issues with Cognito.
     * Our backend then issues its own tokens to the client.
     */
    await this.cognitoService.logout({ cognitoAccessToken: accessToken });

    return {
      accessToken: this.jwtService.signAccessToken({
        sub: user.id,
        username: user.username,
        roles: ['user'], // TODO: add roles
      }),
      refreshToken: this.jwtService.signRefreshToken({
        sub: user.id,
      }),
    };
  }

  async logout(params: LogoutDto): Promise<SuccessResultDto> {
    return this.cognitoService.logout(params);
  }
}
