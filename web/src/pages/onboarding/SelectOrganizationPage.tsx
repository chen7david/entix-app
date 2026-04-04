import { AppRoutes } from "@shared";
import { OrganizationSwitcher, useOrganization } from "@web/src/features/organization";
import { Spin, Typography } from "antd";
import type React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;

export const SelectOrganizationPage: React.FC = () => {
    const { loading, activeOrganization, checkOrganizationStatus } = useOrganization();
    const navigate = useNavigate();

    useEffect(() => {
        if (activeOrganization?.slug) {
            navigate(`/org/${activeOrganization.slug}${AppRoutes.org.dashboard.index}`, {
                replace: true,
            });
        }
    }, [activeOrganization, navigate]);

    if (loading) {
        return <Spin size="large" />;
    }

    return (
        <div className="w-full max-w-md text-center">
            <div className="mb-8 flex justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#646cff] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        E
                    </div>
                    <span className="text-2xl font-bold text-gray-800">Entix</span>
                </div>
            </div>

            <div className="text-center mb-8">
                <Title level={3} style={{ marginBottom: 8 }}>
                    Select Organization
                </Title>
                <Text type="secondary">Choose an organization to continue to your dashboard</Text>
            </div>

            <div className="flex justify-center">
                <OrganizationSwitcher
                    afterSelect={async () => {
                        const { activeOrg } = await checkOrganizationStatus();
                        if (activeOrg?.slug) {
                            navigate(`/org/${activeOrg.slug}${AppRoutes.org.dashboard.index}`, {
                                replace: true,
                            });
                        }
                    }}
                />
            </div>
        </div>
    );
};
