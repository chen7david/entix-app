import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Card, List, Button, Typography, Skeleton } from "antd";
import { useNavigate } from "react-router";
import { PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;

export const OrganizationListPage = () => {
    const { organizations, loading, setActive } = useOrganization();
    const navigate = useNavigate();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <Title level={2}>My Organizations</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/organization/create")}
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
                    renderItem={(org) => (
                        <List.Item>
                            <Card
                                title={org.name}
                                hoverable
                                onClick={() => setActive(org.id)}
                                extra={<Button type="link">Select</Button>}
                            >
                                <p>Slug: {org.slug}</p>
                                <p>Role: {org.role}</p>
                            </Card>
                        </List.Item>
                    )}
                />
            )}
        </div>
    );
};
