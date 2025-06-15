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
  ForgotPasswordDto,
  ForgotPasswordResultDto,
  forgotPasswordSchema,
  ConfirmForgotPasswordDto,
  ConfirmForgotPasswordResultDto,
  confirmForgotPasswordSchema,
  ChangePasswordDto,
  ChangePasswordResultDto,
  changePasswordSchema,
  LogoutDto,
  LogoutResultDto,
  logoutSchema,
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
  async signUp(@Body() params: SignUpDto): Promise<SignUpResultDto> {
    return this.userAuthService.signUp(params);
  }

  @Post('/login')
  @HttpCode(200)
  @UseBefore(validateBody(loginSchema))
  async signIn(@Body() params: LoginDto): Promise<LoginResultDto> {
    return this.userAuthService.login(params);
  }

  @Post('/resend-confirmation-code')
  @HttpCode(200)
  @UseBefore(validateBody(resendConfirmationCodeSchema))
  async resendConfirmationCode(@Body() params: ResendConfirmationCodeDto): Promise<ResendConfirmationCodeResultDto> {
    return this.userAuthService.resendConfirmationCode(params);
  }

  @Post('/confirm-signup')
  @HttpCode(200)
  @UseBefore(validateBody(confirmSignUpSchema))
  async confirmSignUp(@Body() params: ConfirmSignUpDto): Promise<ConfirmSignUpResultDto> {
    return this.userAuthService.confirmSignUp(params);
  }

  @Post('/forgot-password')
  @HttpCode(200)
  @UseBefore(validateBody(forgotPasswordSchema))
  async forgotPassword(@Body() params: ForgotPasswordDto): Promise<ForgotPasswordResultDto> {
    return this.userAuthService.forgotPassword(params);
  }

  @Post('/confirm-forgot-password')
  @HttpCode(200)
  @UseBefore(validateBody(confirmForgotPasswordSchema))
  async confirmForgotPassword(@Body() params: ConfirmForgotPasswordDto): Promise<ConfirmForgotPasswordResultDto> {
    return this.userAuthService.confirmForgotPassword(params);
  }

  @Post('/change-password')
  @HttpCode(200)
  @UseBefore(validateBody(changePasswordSchema))
  async changePassword(@Body() params: ChangePasswordDto): Promise<ChangePasswordResultDto> {
    return this.userAuthService.changePassword(params);
  }

  @Post('/logout')
  @HttpCode(200)
  @UseBefore(validateBody(logoutSchema))
  async logout(@Body() params: LogoutDto): Promise<LogoutResultDto> {
    return this.userAuthService.logout(params);
  }
}
