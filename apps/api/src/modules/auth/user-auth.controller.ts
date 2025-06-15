import { JsonController, Post, Body, UseBefore, HttpCode } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { validateBody } from '@middleware/validation.middleware';
import { signUpSchema, SignUpDto, SignUpResultDto } from '@repo/entix-sdk';
import { UserAuthService } from '@modules/auth/user-auth.service';
import { LoginDto, LoginResultDto } from 'node_modules/@repo/entix-sdk/dist/esm/dtos/user-auth.dto';
import { loginSchema } from 'node_modules/@repo/entix-sdk/dist/esm/schemas/user-auth.schema';

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
}
