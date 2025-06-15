import { CognitoService } from '@services/cognito/cognito.service';
import { Injectable } from '@utils/typedi.util';
import { SignUpDto, SignUpResultDto } from '@repo/entix-sdk';
import { LoginDto, LoginResultDto } from 'node_modules/@repo/entix-sdk/dist/esm/dtos/user-auth.dto';

@Injectable()
export class UserAuthService {
  constructor(private readonly cognitoService: CognitoService) {}

  async signUp(params: SignUpDto): Promise<SignUpResultDto> {
    const result = await this.cognitoService.signUp(params);
    return {
      id: result.userSub,
      email: result.delivery.destination,
      username: result.delivery.destination,
      sub: result.userSub,
    };
  }

  async login(params: LoginDto): Promise<LoginResultDto> {
    return this.cognitoService.login(params);
  }
}
