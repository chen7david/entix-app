import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Typography, Card, Skeleton, Descriptions, Statistic, Row, Col } from "antd";
import { UserOutlined, MailOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useAuth } from "@web/src/hooks/auth/auth.hook";

const { Title } = Typography;

export const OrganizationDashboardPage = () => {
    const { activeOrganization, loading, members, invitations } = useOrganization();
    const { session } = useAuth();
    const userId = session.data?.user?.id;

    const userRoles = useMemo(() => {
        if (!members || !userId) return [];
        const member = members.find((m: any) => m.userId === userId);
        return (member?.role || "").split(",").map((r: string) => r.trim()).filter(Boolean);
    }, [members, userId]);

    if (loading) {
        return <Skeleton active />;
    }

    if (!activeOrganization) {
        return <div>Organization not found</div>;
    }

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <Title level={2}>Dashboard: {activeOrganization.name}</Title>
                </div>

                <Row gutter={16} className="mb-6">
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Total Members"
                                value={members?.length || 0}
                                prefix={<UserOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Pending Invitations"
                                value={invitations?.length || 0}
                                prefix={<MailOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <Statistic
                                title="Created At"
                                value={new Date(activeOrganization.createdAt).toLocaleDateString()}
                                prefix={<FieldTimeOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card title="Organization Details" className="mb-6">
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="ID">{activeOrganization.id}</Descriptions.Item>
                        <Descriptions.Item label="Name">{activeOrganization.name}</Descriptions.Item>
                        <Descriptions.Item label="Slug">{activeOrganization.slug}</Descriptions.Item>
                        <Descriptions.Item label="Role">{userRoles.join(", ") || 'Member'}</Descriptions.Item>
                    </Descriptions>
                </Card>
            </div>
        </>
    );
};
