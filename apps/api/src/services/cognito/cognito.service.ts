import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoToken } from '@factories/cognito.factory';
import { Inject, Injectable } from '@utils/typedi.util';
import { ConfigService } from '../config.service';
import { cognitoLoginResultSchema, cognitoSingUpResultSchema } from './cognito.transformer';
import { CognitoLoginParams, CognitoLoginResult, CognitoSingUpParams, CognitoSingUpResult } from './cognito.model';

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
    console.log(result);
    return cognitoLoginResultSchema.parse(result);
  }
}
