import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Card, List, Button, Typography, Skeleton, Descriptions, Modal, Statistic, Row, Col } from "antd";
import { PlusOutlined, TeamOutlined, MailOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { useState } from "react";
import { CreateOrganizationForm } from "@web/src/components/organization/CreateOrganizationForm";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";

const { Title, Text } = Typography;

export const OrganizationListPage = () => {
    const { organizations, loading, activeOrganization, members, invitations } = useOrganization();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<any>(null);

    if (loading) {
        return (
            <>
                <Toolbar />
                <div className="p-6 max-w-4xl mx-auto">
                    <Skeleton active />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>Manage Organizations</Title>
                        <Text type="secondary">View and manage your organizations</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Create Organization
                    </Button>
                </div>

                {/* Active Org Stats */}
                {activeOrganization && (
                    <Row gutter={16} className="mb-6">
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="Members"
                                    value={members?.length || 0}
                                    prefix={<TeamOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="Pending Invitations"
                                    value={invitations?.length || 0}
                                    prefix={<MailOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="Created"
                                    value={new Date(activeOrganization.createdAt).toLocaleDateString()}
                                    prefix={<FieldTimeOutlined />}
                                />
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Organization List */}
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
                    dataSource={organizations}
                    renderItem={(org) => {
                        const isActive = org.id === activeOrganization?.id;
                        return (
                            <List.Item>
                                <Card
                                    title={
                                        <div className="flex items-center gap-2">
                                            <span>{org.name}</span>
                                            {isActive && (
                                                <span style={{
                                                    fontSize: 11,
                                                    padding: '1px 8px',
                                                    borderRadius: 10,
                                                    background: '#646cff',
                                                    color: '#fff',
                                                    fontWeight: 500,
                                                }}>
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    }
                                    hoverable
                                    className={isActive ? "border-purple-500 border-2" : ""}
                                    onClick={() => setSelectedOrg(org)}
                                >
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Slug">{org.slug}</Descriptions.Item>
                                        <Descriptions.Item label="Created">
                                            {new Date(org.createdAt).toLocaleDateString()}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </List.Item>
                        );
                    }}
                />

                {/* Create Organization Modal */}
                <Modal
                    title="Create Organization"
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                >
                    <CreateOrganizationForm onSuccess={() => setIsModalOpen(false)} />
                </Modal>

                {/* View Organization Details Modal */}
                <Modal
                    title={selectedOrg?.name || 'Organization Details'}
                    open={!!selectedOrg}
                    onCancel={() => setSelectedOrg(null)}
                    footer={
                        <Button onClick={() => setSelectedOrg(null)}>Close</Button>
                    }
                >
                    {selectedOrg && (
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Name">{selectedOrg.name}</Descriptions.Item>
                            <Descriptions.Item label="Slug">{selectedOrg.slug}</Descriptions.Item>
                            <Descriptions.Item label="ID">{selectedOrg.id}</Descriptions.Item>
                            <Descriptions.Item label="Created">
                                {new Date(selectedOrg.createdAt).toLocaleDateString()}
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                </Modal>
            </div>
        </>
    );
};
