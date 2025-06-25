import { type ReactNode } from 'react';
import { useVerifySession } from '@/features/auth/hooks/useAuth';
import { Spin } from 'antd';
import { getAccessToken } from '@lib/jwt.utils';

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * AuthProvider component that handles authentication state
 *
 * Key responsibilities:
 * - Session validation via useVerifySession (React Query)
 * - Auto-logout on session invalidation (e.g., after role changes)
 *
 * Note: Token refresh is handled automatically by the API client interceptor,
 * so we don't need manual token refresh logic here.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isLoading: isVerifying } = useVerifySession();

  // Show loading spinner only during initial session verification
  // (when we have a token but haven't verified the session yet)
  if (isVerifying && getAccessToken()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
};
