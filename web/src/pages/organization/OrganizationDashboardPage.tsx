import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Typography, Card, Skeleton } from "antd";
import { useParams } from "react-router";

const { Title } = Typography;

export const OrganizationDashboardPage = () => {
    const { activeOrganization, loading } = useOrganization();
    const { id } = useParams();

    if (loading) {
        return <Skeleton active />;
    }

    if (!activeOrganization) {
        return <div>Organization not found</div>;
    }

    return (
        <div className="p-6">
            <Title level={2}>Dashboard: {activeOrganization.name}</Title>
            <Card>
                <p>Organization ID: {activeOrganization.id}</p>
                <p>Slug: {activeOrganization.slug}</p>
                {/* Add more organization details here */}
            </Card>
        </div>
    );
};
