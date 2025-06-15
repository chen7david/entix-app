import { JsonController, Post, Body, UseBefore, HttpCode } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { validateBody } from '@middleware/validation.middleware';
import {
  signUpSchema,
  SignUpDto,
  SignUpResultDto,
  ResendConfirmationCodeResultDto,
  ConfirmSignUpDto,
  confirmSignUpSchema,
  ConfirmSignUpResultDto,
} from '@repo/entix-sdk';
import { UserAuthService } from '@modules/auth/user-auth.service';
import {
  LoginDto,
  LoginResultDto,
  ResendConfirmationCodeDto,
} from 'node_modules/@repo/entix-sdk/dist/esm/dtos/user-auth.dto';
import {
  loginSchema,
  resendConfirmationCodeSchema,
} from 'node_modules/@repo/entix-sdk/dist/esm/schemas/user-auth.schema';

@Injectable()
@JsonController('/v1/auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('/signup')
  @HttpCode(201)
  @UseBefore(validateBody(signUpSchema))
  async signUp(@Body() user: SignUpDto): Promise<SignUpResultDto> {
    return this.userAuthService.signUp(user);
  }

  @Post('/login')
  @HttpCode(200)
  @UseBefore(validateBody(loginSchema))
  async signIn(@Body() user: LoginDto): Promise<LoginResultDto> {
    return this.userAuthService.login(user);
  }

  @Post('/resend-confirmation-code')
  @HttpCode(200)
  @UseBefore(validateBody(resendConfirmationCodeSchema))
  async resendConfirmationCode(@Body() user: ResendConfirmationCodeDto): Promise<ResendConfirmationCodeResultDto> {
    return this.userAuthService.resendConfirmationCode(user);
  }

  @Post('/confirm-signup')
  @HttpCode(200)
  @UseBefore(validateBody(confirmSignUpSchema))
  async confirmSignUp(@Body() user: ConfirmSignUpDto): Promise<ConfirmSignUpResultDto> {
    return this.userAuthService.confirmSignUp(user);
  }
}
