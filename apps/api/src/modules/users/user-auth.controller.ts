import { JsonController, Post, Body, UseBefore, HttpCode } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { validateBody } from '@middleware/validation.middleware';
import { signUpSchema, SignUpDto, SignUpResultDto } from '@repo/entix-sdk';
import { UserAuthService } from './user-auth.service';

@Injectable()
@JsonController('/v1/auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('/sign-up')
  @HttpCode(201)
  @UseBefore(validateBody(signUpSchema))
  async signUp(@Body() user: SignUpDto): Promise<SignUpResultDto> {
    return this.userAuthService.signUp(user);
  }
}
