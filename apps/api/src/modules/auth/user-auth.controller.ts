import { JsonController, Post, Body, UseBefore, HttpCode, Get, HeaderParam } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { validateBody, validateHeaders } from '@middleware/validation.middleware';
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
import { CognitoAuthService } from '@modules/auth/cognito-auth.service';
import {
  signUpSchema,
  SignUpDto,
  SignUpResultDto,
  ResendConfirmationCodeResultDto,
  ConfirmSignUpDto,
  confirmSignUpSchema,
  SuccessResultDto,
  ForgotPasswordDto,
  ForgotPasswordResultDto,
  forgotPasswordSchema,
  ConfirmForgotPasswordDto,
  confirmForgotPasswordSchema,
  ChangePasswordDto,
  changePasswordSchema,
  LogoutDto,
  logoutSchema,
  RefreshTokenDto,
  RefreshTokenResultDto,
  refreshTokenSchema,
  verifySessionSchema,
  VerifySessionResultDto,
} from '@repo/entix-sdk';

@Injectable()
@JsonController('/v1/auth')
export class UserAuthController {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly cognitoAuthService: CognitoAuthService,
  ) {}

  @Post('/signup')
  @HttpCode(201)
  @UseBefore(validateBody(signUpSchema))
  async signUp(@Body() params: SignUpDto): Promise<SignUpResultDto> {
    return this.userAuthService.signUp(params);
  }

  @Post('/login')
  @HttpCode(200)
  @UseBefore(validateBody(loginSchema))
  async login(@Body() params: LoginDto): Promise<LoginResultDto> {
    return this.userAuthService.login(params);
  }

  @Post('/refresh-token')
  @HttpCode(200)
  @UseBefore(validateBody(refreshTokenSchema))
  async refreshToken(@Body() params: RefreshTokenDto): Promise<RefreshTokenResultDto> {
    return this.userAuthService.refreshToken(params);
  }

  @Post('/resend-confirmation-code')
  @HttpCode(200)
  @UseBefore(validateBody(resendConfirmationCodeSchema))
  async resendConfirmationCode(@Body() params: ResendConfirmationCodeDto): Promise<ResendConfirmationCodeResultDto> {
    return this.cognitoAuthService.resendConfirmationCode(params);
  }

  @Post('/confirm-signup')
  @HttpCode(200)
  @UseBefore(validateBody(confirmSignUpSchema))
  async confirmSignUp(@Body() params: ConfirmSignUpDto): Promise<SuccessResultDto> {
    return this.cognitoAuthService.confirmSignUp(params);
  }

  @Post('/forgot-password')
  @HttpCode(200)
  @UseBefore(validateBody(forgotPasswordSchema))
  async forgotPassword(@Body() params: ForgotPasswordDto): Promise<ForgotPasswordResultDto> {
    return this.cognitoAuthService.forgotPassword(params);
  }

  @Post('/confirm-forgot-password')
  @HttpCode(200)
  @UseBefore(validateBody(confirmForgotPasswordSchema))
  async confirmForgotPassword(@Body() params: ConfirmForgotPasswordDto): Promise<SuccessResultDto> {
    return this.cognitoAuthService.confirmForgotPassword(params);
  }

  @Post('/change-password')
  @HttpCode(200)
  @UseBefore(validateBody(changePasswordSchema))
  async changePassword(@Body() params: ChangePasswordDto): Promise<SuccessResultDto> {
    return this.cognitoAuthService.changePassword(params);
  }

  @Post('/logout')
  @HttpCode(200)
  @UseBefore(validateBody(logoutSchema))
  async logout(@Body() params: LogoutDto): Promise<SuccessResultDto> {
    return this.userAuthService.logout(params);
  }

  @Get('/verify-session')
  @HttpCode(200)
  @UseBefore(validateHeaders(verifySessionSchema))
  async verifySession(@HeaderParam('Authorization') accessToken: string): Promise<VerifySessionResultDto> {
    return this.userAuthService.verifySession({ accessToken });
  }
}
