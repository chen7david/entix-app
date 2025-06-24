import type {
  LoginDto,
  LoginResultDto,
  VerifySessionResultDto,
  RefreshTokenResultDto,
  SuccessResultDto,
} from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';

/**
 * Authentication service for API operations
 */
export class AuthService {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginDto): Promise<LoginResultDto> {
    return apiClient.auth.login(credentials);
  }

  /**
   * Logout user with refresh token
   */
  async logout(refreshToken: string): Promise<SuccessResultDto> {
    return apiClient.auth.logout({ refreshToken });
  }

  /**
   * Verify current session
   */
  async verifySession(): Promise<VerifySessionResultDto> {
    return apiClient.auth.verifySession();
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResultDto> {
    return apiClient.auth.refreshToken({ refreshToken });
  }
}

/**
 * Singleton instance of auth service
 */
export const authService = new AuthService();
