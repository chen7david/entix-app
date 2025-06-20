import { ApiClient } from './api-client';
import {
  LoginDto,
  LoginResultDto,
  SignUpDto,
  SignUpResultDto,
  ConfirmSignUpDto,
  ResendConfirmationCodeDto,
  ResendConfirmationCodeResultDto,
  ForgotPasswordDto,
  ForgotPasswordResultDto,
  ConfirmForgotPasswordDto,
  ChangePasswordDto,
  LogoutDto,
} from '../dtos/user-auth.dto';

/**
 * API service for authentication-related operations
 */
export class AuthApi {
  private readonly client: ApiClient;
  private readonly basePath = '/v1/auth';

  /**
   * Creates a new AuthApi instance
   * @param client The API client to use for requests
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Logs in a user
   * @param params Login parameters
   * @returns A promise that resolves to the login result
   */
  async login(params: LoginDto): Promise<LoginResultDto> {
    return this.client.post<LoginResultDto>(`${this.basePath}/login`, params);
  }

  /**
   * Registers a new user
   * @param params Registration parameters
   * @returns A promise that resolves to the registration result
   */
  async signUp(params: SignUpDto): Promise<SignUpResultDto> {
    return this.client.post<SignUpResultDto>(`${this.basePath}/signup`, params);
  }

  /**
   * Confirms a user registration
   * @param params Confirmation parameters
   * @returns A promise that resolves when the confirmation is complete
   */
  async confirmSignUp(params: ConfirmSignUpDto): Promise<void> {
    return this.client.post<void>(`${this.basePath}/confirm-signup`, params);
  }

  /**
   * Resends a confirmation code
   * @param params Resend confirmation code parameters
   * @returns A promise that resolves to the resend confirmation code result
   */
  async resendConfirmationCode(params: ResendConfirmationCodeDto): Promise<ResendConfirmationCodeResultDto> {
    return this.client.post<ResendConfirmationCodeResultDto>(`${this.basePath}/resend-confirmation-code`, params);
  }

  /**
   * Initiates a forgot password flow
   * @param params Forgot password parameters
   * @returns A promise that resolves to the forgot password result
   */
  async forgotPassword(params: ForgotPasswordDto): Promise<ForgotPasswordResultDto> {
    return this.client.post<ForgotPasswordResultDto>(`${this.basePath}/forgot-password`, params);
  }

  /**
   * Confirms a forgot password request
   * @param params Confirm forgot password parameters
   * @returns A promise that resolves when the confirmation is complete
   */
  async confirmForgotPassword(params: ConfirmForgotPasswordDto): Promise<void> {
    return this.client.post<void>(`${this.basePath}/confirm-forgot-password`, params);
  }

  /**
   * Changes a user's password
   * @param params Change password parameters
   * @returns A promise that resolves when the password change is complete
   */
  async changePassword(params: ChangePasswordDto): Promise<void> {
    return this.client.post<void>(`${this.basePath}/change-password`, params);
  }

  /**
   * Logs out the current user
   * @returns A promise that resolves when the logout is complete
   */
  async logout(params: LogoutDto): Promise<void> {
    return this.client.post<void>(`${this.basePath}/logout`, params);
  }
}
