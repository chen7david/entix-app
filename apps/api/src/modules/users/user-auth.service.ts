import { CognitoService } from '@services/cognito/cognito.service';
import { Injectable } from '@utils/typedi.util';
import { SignUpDto, SignUpResultDto } from '@repo/entix-sdk';

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
}
