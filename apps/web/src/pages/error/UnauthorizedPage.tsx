import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '@/hooks/auth.hook';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const logout = useLogout();

  const handleLoginRedirect = () => {
    navigate('/auth/login');
  };

  const handleLogoutAndRedirect = async () => {
    await logout.mutateAsync();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <div className="space-x-4">
            {!isAuthenticated ? (
              <>
                <Button type="primary" onClick={handleLoginRedirect}>
                  Login
                </Button>
                <Button onClick={handleGoHome}>Back Home</Button>
              </>
            ) : (
              <>
                <Button type="primary" onClick={handleGoHome}>
                  Back Home
                </Button>
                <Button onClick={handleGoBack}>Go Back</Button>
                <Button onClick={handleLogoutAndRedirect} loading={logout.isPending}>
                  Switch Account
                </Button>
              </>
            )}
          </div>
        }
      />
    </div>
  );
};
