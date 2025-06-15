import { CognitoService } from '@services/cognito/cognito.service';
import { Injectable } from '@utils/typedi.util';
import {
  ConfirmSignUpDto,
  SignUpDto,
  SignUpResultDto,
  ForgotPasswordDto,
  ForgotPasswordResultDto,
  ResendConfirmationCodeResultDto,
  ConfirmSignUpResultDto,
} from '@repo/entix-sdk';
import {
  LoginDto,
  LoginResultDto,
  ResendConfirmationCodeDto,
} from 'node_modules/@repo/entix-sdk/dist/esm/dtos/user-auth.dto';

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

  async resendConfirmationCode(params: ResendConfirmationCodeDto): Promise<ResendConfirmationCodeResultDto> {
    return this.cognitoService.resendConfirmationCode(params);
  }

  async confirmSignUp(params: ConfirmSignUpDto): Promise<ConfirmSignUpResultDto> {
    return this.cognitoService.confirmSignUp(params);
  }

  async forgotPassword(params: ForgotPasswordDto): Promise<ForgotPasswordResultDto> {
    return this.cognitoService.forgotPassword(params);
  }
}
