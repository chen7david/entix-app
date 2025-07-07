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
  SuccessResultDto,
  VerifySessionResultDto,
  RefreshTokenDto,
  RefreshTokenResultDto,
} from '../dtos/user-auth.dto';

/**
 * API service for authentication-related operations
 */
export class AuthApi {
  private readonly httpClient: ApiClient;
  private readonly authEndpointBase = '/v1/auth';

  /**
   * Creates a new AuthApi instance
   * @param client The API client to use for requests
   */
  constructor(client: ApiClient) {
    this.httpClient = client;
  }

  /**
   * Logs in a user
   * @param loginCredentials Login parameters
   * @returns A promise that resolves to the login result
   */
  async login(loginCredentials: LoginDto): Promise<LoginResultDto> {
    return this.httpClient.post<LoginResultDto>(`${this.authEndpointBase}/login`, loginCredentials);
  }

  /**
   * Registers a new user
   * @param registrationData Registration parameters
   * @returns A promise that resolves to the registration result
   */
  async signUp(registrationData: SignUpDto): Promise<SignUpResultDto> {
    return this.httpClient.post<SignUpResultDto>(`${this.authEndpointBase}/signup`, registrationData);
  }

  /**
   * Confirms a user registration
   * @param confirmationData Confirmation parameters
   * @returns A promise that resolves when the confirmation is complete
   */
  async confirmSignUp(confirmationData: ConfirmSignUpDto): Promise<SuccessResultDto> {
    return this.httpClient.post<SuccessResultDto>(`${this.authEndpointBase}/confirm-signup`, confirmationData);
  }

  /**
   * Resends a confirmation code
   * @param resendRequest Resend confirmation code parameters
   * @returns A promise that resolves to the resend confirmation code result
   */
  async resendConfirmationCode(resendRequest: ResendConfirmationCodeDto): Promise<ResendConfirmationCodeResultDto> {
    return this.httpClient.post<ResendConfirmationCodeResultDto>(
      `${this.authEndpointBase}/resend-confirmation-code`,
      resendRequest,
    );
  }

  /**
   * Initiates a forgot password flow
   * @param passwordResetRequest Forgot password parameters
   * @returns A promise that resolves to the forgot password result
   */
  async forgotPassword(passwordResetRequest: ForgotPasswordDto): Promise<ForgotPasswordResultDto> {
    return this.httpClient.post<ForgotPasswordResultDto>(
      `${this.authEndpointBase}/forgot-password`,
      passwordResetRequest,
    );
  }

  /**
   * Confirms a forgot password request
   * @param passwordResetConfirmation Confirm forgot password parameters
   * @returns A promise that resolves when the confirmation is complete
   */
  async confirmForgotPassword(passwordResetConfirmation: ConfirmForgotPasswordDto): Promise<SuccessResultDto> {
    return this.httpClient.post<SuccessResultDto>(
      `${this.authEndpointBase}/confirm-forgot-password`,
      passwordResetConfirmation,
    );
  }

  /**
   * Changes a user's password
   * @param passwordChangeRequest Change password parameters
   * @returns A promise that resolves when the password change is complete
   */
  async changePassword(passwordChangeRequest: ChangePasswordDto): Promise<SuccessResultDto> {
    return this.httpClient.post<SuccessResultDto>(`${this.authEndpointBase}/change-password`, passwordChangeRequest);
  }

  /**
   * Logs out the current user
   * @param logoutRequest Logout parameters
   * @returns A promise that resolves when the logout is complete
   */
  async logout(logoutRequest: LogoutDto): Promise<SuccessResultDto> {
    return this.httpClient.post<SuccessResultDto>(`${this.authEndpointBase}/logout`, logoutRequest);
  }

  /**
   * Refreshes the access token using a refresh token
   * @param refreshRequest Refresh token parameters
   * @returns A promise that resolves to the refresh token result
   */
  async refreshToken(refreshRequest: RefreshTokenDto): Promise<RefreshTokenResultDto> {
    return this.httpClient.post<RefreshTokenResultDto>(`${this.authEndpointBase}/refresh-token`, refreshRequest);
  }

  /**
   * Verifies if the current user session is valid
   * @returns A promise that resolves to a success result
   */
  async verifySession(): Promise<VerifySessionResultDto> {
    return this.httpClient.get<VerifySessionResultDto>(`${this.authEndpointBase}/verify-session`);
  }
}
