import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Card, List, Button, Typography, Skeleton } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;

import { useState } from "react";
import { CreateOrganizationForm } from "@web/src/components/organization/CreateOrganizationForm";
import { Modal } from "antd";

import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";

export const OrganizationListPage = () => {
    const { organizations, loading, setActive, activeOrganization } = useOrganization();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Title level={2}>My Organizations</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Create Organization
                    </Button>
                </div>

                {loading ? (
                    <Skeleton active />
                ) : (
                    <List
                        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
                        dataSource={organizations}
                        renderItem={(org) => {
                            const isActive = org.id === activeOrganization?.id;
                            return (
                                <List.Item>
                                    <Card
                                        title={org.name}
                                        hoverable
                                        className={isActive ? "border-purple-500 border-2" : ""}
                                        onClick={() => !isActive && setActive(org.id)}
                                        extra={
                                            <Button
                                                type={isActive ? "primary" : "default"}
                                                disabled={isActive}
                                                className={isActive ? "bg-purple-500" : ""}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isActive) setActive(org.id);
                                                }}
                                            >
                                                {isActive ? "Active" : "Select"}
                                            </Button>
                                        }
                                    >
                                        <p>Slug: {org.slug}</p>
                                    </Card>
                                </List.Item>
                            );
                        }}
                    />
                )}

                <Modal
                    title="Create Organization"
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                >
                    <CreateOrganizationForm onSuccess={() => setIsModalOpen(false)} />
                </Modal>
            </div>
        </>
    );
};
