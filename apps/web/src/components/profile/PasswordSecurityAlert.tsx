import { Alert } from 'antd';
import { PROFILE_STYLES } from './constants';

interface PasswordSecurityAlertProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Password security alert component with close functionality
 */
export const PasswordSecurityAlert = ({ visible, onClose }: PasswordSecurityAlertProps) => {
  if (!visible) return null;

  return (
    <Alert
      message="Password Security"
      description="For enhanced security, password changes require re-authentication through the secure password reset flow."
      type="info"
      showIcon
      closable
      onClose={onClose}
      style={PROFILE_STYLES.card}
    />
  );
};
