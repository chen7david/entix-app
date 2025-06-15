import { Injectable, Token } from '@utils/typedi.util';
import { ConfigService } from '@services/config.service';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

export const CognitoToken = new Token<CognitoIdentityProviderClient>('CognitoToken');

@Injectable()
export class CognitoFactory {
  constructor(private readonly configService: ConfigService) {}

  create() {
    return new CognitoIdentityProviderClient({
      region: this.configService.env.AWS_REGION,
      credentials: {
        accessKeyId: this.configService.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: this.configService.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
}
