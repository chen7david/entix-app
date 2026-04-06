import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { AppRoutes, getAvatarUrl } from "@shared";
import { useSignOut } from "@web/src/features/auth";
import { AvatarDropzone } from "@web/src/features/media";
import { useOrganization } from "@web/src/features/organization";
import {
    PasswordUpdateForm,
    UserContactList,
    UserProfileForm,
} from "@web/src/features/user-profiles";
import { useSession } from "@web/src/lib/auth-client";
import { DateUtils } from "@web/src/utils/date";
import { App, Avatar, Button, Card, Col, Divider, Row, Spin, Tooltip, Typography } from "antd";
import type React from "react";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
    const { notification } = App.useApp();
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();
    const { activeOrganization } = useOrganization();
    const { mutate: signOut } = useSignOut();

    const handleLogout = () => {
        signOut(undefined, {
            onSuccess: () => {
                notification.success({
                    message: "Logout Successful",
                    description: "You have been logged out successfully.",
                });
                navigate(AppRoutes.auth.signIn);
            },
            onError: (err) => {
                notification.error({
                    message: "Logout Failed",
                    description: err.message || "Failed to log out",
                });
            },
        });
    };

    if (isPending) {
        return (
            <div className="flex justify-center items-center py-24">
                <Spin size="large" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex justify-center items-center py-24">
                <Card className="text-center">
                    <Title level={4}>You are not logged in</Title>
                    <Button type="primary" onClick={() => navigate(AppRoutes.auth.signIn)}>
                        Go to Sign In
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    My Profile
                </Title>
                <Text type="secondary">Manage your personal information and security settings</Text>
            </div>
            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card
                        className="shadow-sm"
                        actions={[
                            <Button
                                key="logout"
                                type="text"
                                danger
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>,
                        ]}
                    >
                        <div className="flex flex-col items-center mb-6 text-center">
                            {activeOrganization ? (
                                <AvatarDropzone
                                    organizationId={activeOrganization.id}
                                    userId={session.user.id}
                                    currentImageUrl={getAvatarUrl(session.user.image, "lg")}
                                    size={96}
                                />
                            ) : (
                                <Avatar
                                    size={96}
                                    icon={<UserOutlined />}
                                    src={getAvatarUrl(session.user.image, "lg")}
                                />
                            )}
                            <Title level={4} style={{ marginTop: "16px", marginBottom: "4px" }}>
                                {session.user.name}
                            </Title>
                            <Text type="secondary">{session.user.email}</Text>
                        </div>

                        <Divider />

                        <div className="flex justify-between items-center py-2">
                            <Text type="secondary">Status</Text>
                            <Text>{session.user.emailVerified ? "Verified" : "Unverified"}</Text>
                        </div>

                        <div className="flex justify-between items-center py-2">
                            <Text type="secondary">Joined</Text>
                            <Tooltip
                                title={DateUtils.format(
                                    new Date(session.user.createdAt).getTime(),
                                    "LLL"
                                )}
                            >
                                <Text>
                                    {DateUtils.fromNow(new Date(session.user.createdAt).getTime())}
                                </Text>
                            </Tooltip>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <div className="flex flex-col gap-6">
                        <Card title="Personal Information" className="shadow-sm">
                            <UserProfileForm userId={session.user.id} />
                        </Card>
                        <UserContactList userId={session.user.id} hideSocial hideCopy />
                        <PasswordUpdateForm />
                    </div>
                </Col>
            </Row>
        </div>
    );
};
