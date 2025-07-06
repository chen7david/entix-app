import { CognitoService } from '@services/cognito/cognito.service';
import { Injectable } from '@utils/typedi.util';
import {
  ResendConfirmationCodeDto,
  ConfirmSignUpDto,
  ForgotPasswordDto,
  ForgotPasswordResultDto,
  ResendConfirmationCodeResultDto,
  SuccessResultDto,
  ConfirmForgotPasswordDto,
  ChangePasswordDto,
} from '@repo/entix-sdk';

@Injectable()
export class CognitoAuthService {
  constructor(private readonly cognitoService: CognitoService) {}

  async resendConfirmationCode(params: ResendConfirmationCodeDto): Promise<ResendConfirmationCodeResultDto> {
    return this.cognitoService.resendConfirmationCode(params);
  }

  async confirmSignUp(params: ConfirmSignUpDto): Promise<SuccessResultDto> {
    return this.cognitoService.confirmSignUp(params);
  }

  async forgotPassword(params: ForgotPasswordDto): Promise<ForgotPasswordResultDto> {
    return this.cognitoService.forgotPassword(params);
  }

  async confirmForgotPassword(params: ConfirmForgotPasswordDto): Promise<SuccessResultDto> {
    return this.cognitoService.confirmForgotPassword(params);
  }

  async changePassword(params: ChangePasswordDto): Promise<SuccessResultDto> {
    return this.cognitoService.changePassword({
      cognitoAccessToken: params.accessToken,
      previousPassword: params.oldPassword,
      proposedPassword: params.newPassword,
    });
  }
}
