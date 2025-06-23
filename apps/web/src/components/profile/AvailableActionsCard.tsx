import { Card, Button, Row, Col, Typography } from 'antd';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PermissionCode } from '@repo/entix-sdk';
import { useProfileActions } from '@/hooks/profile/useProfileActions';
import { PROFILE_STYLES, AVAILABLE_ACTIONS } from './constants';

const { Text } = Typography;

/**
 * Available actions card component with permission-based buttons
 */
export const AvailableActionsCard = () => {
  const { handleNavigation } = useProfileActions();

  /**
   * Renders the fallback UI for actions without permissions
   */
  const renderFallback = (text: string) => (
    <div style={PROFILE_STYLES.permissionFallback}>
      <Text type="secondary">{text}</Text>
    </div>
  );

  /**
   * Renders an action button with proper permission guards
   */
  const renderAction = (action: (typeof AVAILABLE_ACTIONS)[number]) => {
    const button = (
      <Button
        type={action.type}
        style={PROFILE_STYLES.actionButton}
        size="large"
        onClick={() => handleNavigation(action.href)}
      >
        {action.title}
      </Button>
    );

    // Handle different permission types
    if ('permission' in action) {
      return (
        <PermissionGuard
          key={action.title}
          permission={PermissionCode[action.permission]}
          fallback={renderFallback(action.fallbackText)}
        >
          {button}
        </PermissionGuard>
      );
    }

    if ('anyPermissions' in action) {
      return (
        <PermissionGuard
          key={action.title}
          anyPermissions={action.anyPermissions.map(p => PermissionCode[p])}
          fallback={renderFallback(action.fallbackText)}
        >
          {button}
        </PermissionGuard>
      );
    }

    if ('allPermissions' in action) {
      return (
        <PermissionGuard
          key={action.title}
          allPermissions={action.allPermissions.map(p => PermissionCode[p])}
          fallback={renderFallback(action.fallbackText)}
        >
          {button}
        </PermissionGuard>
      );
    }

    return button;
  };

  return (
    <Card title="Available Actions" style={PROFILE_STYLES.card}>
      <Row gutter={[16, 16]}>
        {AVAILABLE_ACTIONS.map(action => (
          <Col key={action.title} xs={24} md={8}>
            {renderAction(action)}
          </Col>
        ))}
      </Row>
    </Card>
  );
};
