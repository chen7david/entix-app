import { Alert, Button, Popconfirm, Typography, theme } from "antd";
import type React from "react";

const { Title, Text } = Typography;

type SessionDangerZoneProps = {
    session: any | null;
    onDelete: () => void;
};

export const SessionDangerZone: React.FC<SessionDangerZoneProps> = ({ session, onDelete }) => {
    const { token } = theme.useToken();

    if (!session) return null;

    return (
        <div style={{ marginTop: 16 }}>
            <div
                style={{
                    marginBottom: 24,
                    padding: 16,
                    borderRadius: token.borderRadiusLG,
                    border: `1px solid ${token.colorErrorBorder}`,
                    backgroundColor: token.colorErrorBg,
                }}
            >
                <Title level={5} type="danger" style={{ marginTop: 0 }}>
                    Danger Zone
                </Title>
                <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                    These actions are destructive and cannot be undone. Please be careful.
                </Text>

                <Alert
                    type="error"
                    message="Deleting a session will remove all attendance logs and performance notes associated with it."
                    style={{ marginBottom: 16 }}
                />

                <Popconfirm
                    title="Delete Session"
                    description={
                        session.seriesId
                            ? "This is a recurring session. You will be asked if you want to delete just this occurrence or the whole series."
                            : "Are you sure you want to delete this session? This action cannot be undone."
                    }
                    onConfirm={onDelete}
                    okText="Delete"
                    cancelText="Cancel"
                    okType="danger"
                >
                    <Button danger type="primary">
                        Delete Session
                    </Button>
                </Popconfirm>
            </div>
        </div>
    );
};
