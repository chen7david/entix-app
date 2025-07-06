import { apiClient } from '@lib/api-client';
import { appConfig } from '@config/app.config';
import { getCurrentUserFromToken } from '@lib/jwt.utils';
import type {
  LoginDto,
  SignUpDto,
  ConfirmSignUpDto,
  ForgotPasswordDto,
  ConfirmForgotPasswordDto,
  ChangePasswordDto,
  LogoutDto,
  RefreshTokenDto,
  ResendConfirmationCodeDto,
} from '@repo/entix-sdk';

/**
 * Authentication service for handling all auth-related operations
 * Provides centralized business logic, error handling, and data transformations
 */
export class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginDto) {
    try {
      const result = await apiClient.auth.login(credentials);

      // Store tokens in localStorage
      localStorage.setItem(appConfig.VITE_ACCESS_TOKEN_KEY, result.accessToken);
      localStorage.setItem(appConfig.VITE_REFRESH_TOKEN_KEY, result.refreshToken);

      return result;
    } catch (error) {
      // Centralized error handling
      console.error('Login failed:', error);
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  }

  /**
   * Sign up new user
   */
  async signUp(userData: SignUpDto) {
    try {
      return await apiClient.auth.signUp(userData);
    } catch (error) {
      console.error('Sign up failed:', error);
      throw new Error('Sign up failed. Please try again.');
    }
  }

  /**
   * Confirm user sign up with code
   */
  async confirmSignUp(confirmationData: ConfirmSignUpDto) {
    try {
      return await apiClient.auth.confirmSignUp(confirmationData);
    } catch (error) {
      console.error('Sign up confirmation failed:', error);
      throw new Error('Confirmation failed. Please check your code and try again.');
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(resendData: ResendConfirmationCodeDto) {
    try {
      return await apiClient.auth.resendConfirmationCode(resendData);
    } catch (error) {
      console.error('Failed to resend confirmation code:', error);
      throw new Error('Failed to resend confirmation code. Please try again.');
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(emailData: ForgotPasswordDto) {
    try {
      return await apiClient.auth.forgotPassword(emailData);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw new Error('Password reset request failed. Please try again.');
    }
  }

  /**
   * Confirm password reset with code
   */
  async confirmForgotPassword(resetData: ConfirmForgotPasswordDto) {
    try {
      return await apiClient.auth.confirmForgotPassword(resetData);
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      throw new Error('Password reset failed. Please check your code and try again.');
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordDto) {
    try {
      return await apiClient.auth.changePassword(passwordData);
    } catch (error) {
      console.error('Password change failed:', error);
      throw new Error('Password change failed. Please try again.');
    }
  }

  /**
   * Logout user and clear tokens
   */
  async logout(logoutData?: LogoutDto) {
    try {
      if (logoutData) {
        await apiClient.auth.logout(logoutData);
      } else {
        // Get refresh token from localStorage for logout
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          await apiClient.auth.logout({ refreshToken });
        }
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear tokens even if API call fails
      localStorage.removeItem(appConfig.VITE_ACCESS_TOKEN_KEY);
      localStorage.removeItem(appConfig.VITE_REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshData: RefreshTokenDto) {
    try {
      const result = await apiClient.auth.refreshToken(refreshData);

      // Update stored tokens
      localStorage.setItem(appConfig.VITE_ACCESS_TOKEN_KEY, result.accessToken);
      localStorage.setItem(appConfig.VITE_REFRESH_TOKEN_KEY, result.refreshToken);

      return result;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Verify current session
   */
  async verifySession() {
    try {
      return await apiClient.auth.verifySession();
    } catch (error) {
      console.error('Session verification failed:', error);
      throw new Error('Session verification failed.');
    }
  }

  /**
   * Get current user from token (no API call)
   */
  getCurrentUser() {
    return getCurrentUserFromToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY);
    return !!accessToken;
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(appConfig.VITE_ACCESS_TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(appConfig.VITE_REFRESH_TOKEN_KEY);
  }
}

// Export singleton instance
export const authService = new AuthService();
