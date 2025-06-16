import { CognitoService } from '@services/cognito/cognito.service';
import { Injectable } from '@utils/typedi.util';
import { ResendConfirmationCodeDto } from 'node_modules/@repo/entix-sdk/dist/esm/dtos/user-auth.dto';
import {
  ConfirmSignUpDto,
  ForgotPasswordDto,
  ForgotPasswordResultDto,
  ResendConfirmationCodeResultDto,
  ConfirmSignUpResultDto,
  ConfirmForgotPasswordDto,
  ConfirmForgotPasswordResultDto,
  ChangePasswordDto,
  ChangePasswordResultDto,
} from '@repo/entix-sdk';

@Injectable()
export class CognitoAuthService {
  constructor(private readonly cognitoService: CognitoService) {}

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
}
