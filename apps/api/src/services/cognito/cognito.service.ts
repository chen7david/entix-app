import { CognitoToken } from '@factories/cognito.factory';
import { Inject, Injectable } from '@utils/typedi.util';
import { ConfigService } from '../config.service';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CognitoLoginParams,
  CognitoLoginResult,
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
}
