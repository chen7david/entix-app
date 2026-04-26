import { Alert, App, Button, Popconfirm, Typography, theme } from "antd";
import type React from "react";

const { Title, Text } = Typography;

type SessionDangerZoneProps = {
    session: any | null;
    onDelete: (deleteForward: boolean) => void;
};

export const SessionDangerZone: React.FC<SessionDangerZoneProps> = ({ session, onDelete }) => {
    const { token } = theme.useToken();
    const { modal } = App.useApp();

    if (!session) return null;

    const handleDelete = () => {
        if (session.seriesId) {
            modal.confirm({
                title: "Delete Recurring Session",
                content:
                    "Do you want to delete just this occurrence, or this and all following sessions in the series?",
                closable: true,
                okText: "Delete following",
                cancelText: "Just this",
                okType: "danger",
                cancelButtonProps: { danger: true },
                onOk: () => onDelete(true),
                onCancel: () => onDelete(false),
            });
        } else {
            onDelete(false);
        }
    };

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

                {!session.seriesId ? (
                    <Popconfirm
                        title="Delete Session"
                        description="Are you sure you want to delete this session? This action cannot be undone."
                        onConfirm={handleDelete}
                        okText="Delete"
                        cancelText="Cancel"
                        okType="danger"
                    >
                        <Button danger type="primary">
                            Delete Session
                        </Button>
                    </Popconfirm>
                ) : (
                    <Button danger type="primary" onClick={handleDelete}>
                        Delete Session
                    </Button>
                )}
            </div>
        </div>
    );
};
