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
  ConfirmForgotPasswordDto,
  ConfirmForgotPasswordResultDto,
  ChangePasswordDto,
  ChangePasswordResultDto,
  LogoutDto,
  LogoutResultDto,
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

  async confirmForgotPassword(params: ConfirmForgotPasswordDto): Promise<ConfirmForgotPasswordResultDto> {
    return this.cognitoService.confirmForgotPassword(params);
  }

  async changePassword(params: ChangePasswordDto): Promise<ChangePasswordResultDto> {
    return this.cognitoService.changePassword({
      cognitoAccessToken: params.cognitoAccessToken,
      previousPassword: params.oldPassword,
      proposedPassword: params.newPassword,
    });
  }

  async logout(params: LogoutDto): Promise<LogoutResultDto> {
    return this.cognitoService.logout(params);
  }
}
