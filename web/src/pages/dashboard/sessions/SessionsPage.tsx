import React from 'react';
import {
    List,
    Card,
    Button,
    Typography,
    Space,
    Tag,
    Empty,
    Skeleton,
    Popconfirm,
    message,
    theme,
    Tooltip
} from 'antd';
import {
    LaptopOutlined,
    MobileOutlined,
    GlobalOutlined,
    ClockCircleOutlined,
    SafetyOutlined,
    DeleteOutlined,
    CopyOutlined
} from '@ant-design/icons';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { useListSessions, useRevokeSession, useRevokeOtherSessions } from '@web/src/hooks/auth/useSessions';
import { useAuth } from '@web/src/hooks/auth/auth.hook';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export const SessionsPage: React.FC = () => {
    const { token } = theme.useToken();
    const { data: sessions, isLoading } = useListSessions();
    const { session: currentSession } = useAuth();
    const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession();
    const { mutate: revokeOtherSessions, isPending: isRevokingAll } = useRevokeOtherSessions();

    const handleRevokeSession = (token: string) => {
        revokeSession(token, {
            onSuccess: () => {
                message.success('Session revoked successfully');
            },
            onError: () => {
                message.error('Failed to revoke session');
            },
        });
    };

    const handleRevokeAllOtherSessions = () => {
        revokeOtherSessions(undefined, {
            onSuccess: () => {
                message.success('All other sessions revoked successfully');
            },
            onError: () => {
                message.error('Failed to revoke sessions');
            },
        });
    };

    const getDeviceIcon = (userAgent?: string) => {
        if (!userAgent) return <LaptopOutlined />;
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return <MobileOutlined />;
        }
        return <LaptopOutlined />;
    };

    const getDeviceInfo = (userAgent?: string) => {
        if (!userAgent) return 'Unknown Device';

        // Simple browser detection
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';

        return 'Unknown Browser';
    };

    const isCurrentSession = (sessionToken?: string) => {
        return sessionToken === currentSession.data?.session?.token;
    };

    const sortedSessions = React.useMemo(() => {
        if (!sessions) return [];
        return [...sessions].sort((a, b) => {
            const aIsCurrent = isCurrentSession(a.token);
            const bIsCurrent = isCurrentSession(b.token);
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            return 0;
        });
    }, [sessions, currentSession]);

    const otherSessionsCount = sortedSessions.filter(s => !isCurrentSession(s.token)).length || 0;

    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="!mb-2">Active Sessions</Title>
                        <Text type="secondary">
                            Manage your active sessions across all devices
                        </Text>
                    </div>
                    {otherSessionsCount > 0 && (
                        <Popconfirm
                            title="Revoke all other sessions?"
                            description="This will sign you out from all other devices except this one."
                            onConfirm={handleRevokeAllOtherSessions}
                            okText="Revoke All"
                            okButtonProps={{ danger: true }}
                            cancelText="Cancel"
                        >
                            <Button
                                danger
                                loading={isRevokingAll}
                                icon={<DeleteOutlined />}
                            >
                                Revoke All Other Sessions
                            </Button>
                        </Popconfirm>
                    )}
                </div>

                {isLoading ? (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Skeleton active paragraph={{ rows: 3 }} />
                        <Skeleton active paragraph={{ rows: 3 }} />
                    </Space>
                ) : !sessions || sessions.length === 0 ? (
                    <Empty
                        description="No active sessions found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <List
                        dataSource={sortedSessions}
                        renderItem={(session) => {
                            const isCurrent = isCurrentSession(session.token);

                            return (
                                <List.Item style={{ padding: 0, border: 'none', marginBottom: 16 }}>
                                    <Card
                                        style={{
                                            width: '100%',
                                            borderColor: isCurrent ? token.colorPrimary : token.colorBorder,
                                        }}
                                        styles={{
                                            body: { padding: 20 }
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <Space direction="vertical" size="small" style={{ flex: 1 }}>
                                                <Space>
                                                    <span style={{ fontSize: 24 }}>
                                                        {getDeviceIcon(session.userAgent)}
                                                    </span>
                                                    <div>
                                                        <Space>
                                                            <Text strong style={{ fontSize: 16 }}>
                                                                {getDeviceInfo(session.userAgent)}
                                                            </Text>
                                                            {isCurrent && (
                                                                <Tag
                                                                    color="success"
                                                                    icon={<SafetyOutlined />}
                                                                >
                                                                    Current Session
                                                                </Tag>
                                                            )}
                                                        </Space>
                                                        <div style={{ marginTop: 4 }}>
                                                            <Space split={<span>•</span>} size="small">
                                                                {session.ipAddress && (
                                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                                        <GlobalOutlined /> {session.ipAddress}
                                                                    </Text>
                                                                )}
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    <ClockCircleOutlined /> Active {dayjs(session.createdAt).fromNow()}
                                                                </Text>
                                                            </Space>
                                                        </div>
                                                    </div>
                                                </Space>

                                                {session.userAgent && (
                                                    <div className="flex items-center gap-2 mt-2 w-full max-w-full overflow-hidden">
                                                        <Tooltip title="Copy User Agent">
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<CopyOutlined style={{ fontSize: 12 }} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (session.userAgent) {
                                                                        navigator.clipboard.writeText(session.userAgent);
                                                                        message.success('User Agent copied');
                                                                    }
                                                                }}
                                                                style={{ flexShrink: 0 }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip title={session.userAgent}>
                                                            <Text
                                                                type="secondary"
                                                                style={{
                                                                    fontSize: 11,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    flex: 1,
                                                                    minWidth: 0
                                                                }}
                                                                className="cursor-help"
                                                            >
                                                                {session.userAgent}
                                                            </Text>
                                                        </Tooltip>
                                                    </div>
                                                )}
                                            </Space>

                                            {!isCurrent && (
                                                <Popconfirm
                                                    title="Revoke this session?"
                                                    description="You will be signed out from this device."
                                                    onConfirm={() => handleRevokeSession(session.token)}
                                                    okText="Revoke"
                                                    okButtonProps={{ danger: true }}
                                                    cancelText="Cancel"
                                                >
                                                    <Button
                                                        danger
                                                        type="text"
                                                        icon={<DeleteOutlined />}
                                                        loading={isRevoking}
                                                    >
                                                        Revoke
                                                    </Button>
                                                </Popconfirm>
                                            )}
                                        </div>
                                    </Card>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </div>
        </>
    );
};
