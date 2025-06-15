import { CognitoToken } from '@factories/cognito.factory';
import { Inject, Injectable } from '@utils/typedi.util';
import { ConfigService } from '../config.service';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
  ResendConfirmationCodeCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CognitoChangePasswordParams,
  CognitoChangePasswordResult,
  CognitoConfirmForgotPasswordParams,
  CognitoConfirmForgotPasswordResult,
  CognitoConfirmSignUpParams,
  CognitoConfirmSignUpResult,
  CognitoForgotPasswordParams,
  CognitoForgotPasswordResult,
  CognitoLoginParams,
  CognitoLoginResult,
  CognitoLogoutParams,
  CognitoLogoutResult,
  CognitoRefreshTokenParams,
  CognitoRefreshTokenResult,
  CognitoResendConfirmationCodeParams,
  CognitoResendConfirmationCodeResult,
  CognitoSingUpParams,
  CognitoSingUpResult,
} from './cognito.model';
import { codeDeliveryDetailsSchema, cognitoLoginResultSchema, cognitoSingUpResultSchema } from './cognito.transformer';

@Injectable()
export class CognitoService {
  constructor(
    @Inject(CognitoToken) private readonly cognitoClient: CognitoIdentityProviderClient,
    private readonly configService: ConfigService,
  ) {}

  async signUp(params: CognitoSingUpParams): Promise<CognitoSingUpResult> {
    const command = new SignUpCommand({
      ClientId: this.configService.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
      Username: params.username,
      Password: params.password,
      UserAttributes: [{ Name: 'email', Value: params.email }],
    });
    const result = await this.cognitoClient.send(command);
    return cognitoSingUpResultSchema.parse(result);
  }

  async login(params: CognitoLoginParams): Promise<CognitoLoginResult> {
    const command = new InitiateAuthCommand({
      ClientId: this.configService.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: params.username,
        PASSWORD: params.password,
      },
    });
    const result = await this.cognitoClient.send(command);
    return cognitoLoginResultSchema.parse(result);
  }

  async resendConfirmationCode(
    params: CognitoResendConfirmationCodeParams,
  ): Promise<CognitoResendConfirmationCodeResult> {
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.configService.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
      Username: params.username,
    });
    const result = await this.cognitoClient.send(command);
    return codeDeliveryDetailsSchema.parse(result.CodeDeliveryDetails);
  }

  async confirmSignUp(params: CognitoConfirmSignUpParams): Promise<CognitoConfirmSignUpResult> {
    const command = new ConfirmSignUpCommand({
      ClientId: this.configService.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
      Username: params.username,
      ConfirmationCode: params.confirmationCode,
    });
    await this.cognitoClient.send(command);
    return {
      success: true,
    };
  }

  async forgotPassword(params: CognitoForgotPasswordParams): Promise<CognitoForgotPasswordResult> {
    const command = new ForgotPasswordCommand({
      ClientId: this.configService.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
      Username: params.username,
    });
    const result = await this.cognitoClient.send(command);
    return codeDeliveryDetailsSchema.parse(result.CodeDeliveryDetails);
  }

  async confirmForgotPassword(params: CognitoConfirmForgotPasswordParams): Promise<CognitoConfirmForgotPasswordResult> {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.configService.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
      Username: params.username,
      ConfirmationCode: params.confirmationCode,
      Password: params.password,
    });
    await this.cognitoClient.send(command);
    return {
      success: true,
    };
  }

  async changePassword(params: CognitoChangePasswordParams): Promise<CognitoChangePasswordResult> {
    const command = new ChangePasswordCommand({
      PreviousPassword: params.previousPassword,
      ProposedPassword: params.proposedPassword,
      AccessToken: params.cognitoAccessToken,
    });
    await this.cognitoClient.send(command);
    return {
      success: true,
    };
  }

  async refreshToken(params: CognitoRefreshTokenParams): Promise<CognitoRefreshTokenResult> {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: this.configService.env.AWS_COGNITO_USER_POOL_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: params.cognitoRefreshToken,
      },
    });
    const result = await this.cognitoClient.send(command);
    return cognitoLoginResultSchema.parse(result);
  }

  async logout(params: CognitoLogoutParams): Promise<CognitoLogoutResult> {
    const command = new GlobalSignOutCommand({
      AccessToken: params.cognitoAccessToken,
    });
    await this.cognitoClient.send(command);
    return {
      success: true,
    };
  }
}
