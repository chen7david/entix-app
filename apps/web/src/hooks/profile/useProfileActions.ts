import { useState } from 'react';
import { useLogout } from '@/hooks/auth.hook';

/**
 * Custom hook for handling profile page actions
 */
export const useProfileActions = () => {
  const logout = useLogout();
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);

  /**
   * Handles password change warning and logout flow
   */
  const handlePasswordChangeWarning = () => {
    setShowPasswordAlert(true);
    // Show password change security warning
    const confirmed = window.confirm(
      'For security reasons, password changes are not available here. You will be logged out and redirected to the password reset flow. Continue?',
    );

    if (confirmed) {
      logout.mutate();
    } else {
      // Hide alert if user cancels
      setTimeout(() => setShowPasswordAlert(false), 3000);
    }
  };

  /**
   * Handles navigation to different pages
   * @param href - The page URL to navigate to
   */
  const handleNavigation = (href: string) => {
    window.location.href = href;
  };

  /**
   * Handles logout action
   */
  const handleLogout = () => {
    logout.mutate();
  };

  /**
   * Dismisses the password alert
   */
  const dismissPasswordAlert = () => {
    setShowPasswordAlert(false);
  };

  return {
    // State
    showPasswordAlert,
    isLoggingOut: logout.isPending,

    // Actions
    handlePasswordChangeWarning,
    handleNavigation,
    handleLogout,
    dismissPasswordAlert,
  };
};
