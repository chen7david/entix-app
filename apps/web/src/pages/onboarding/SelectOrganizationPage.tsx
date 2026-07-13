import { OrganizationSwitcher } from "@web/src/features/organization";
import { Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const SelectOrganizationPage: React.FC = () => {
    return (
        <div className="w-full max-w-md text-center">
            <div className="mb-6">
                <Title level={3} className="!mb-2 font-display tracking-tight">
                    Select organization
                </Title>
                <Text type="secondary">Choose an organization to continue to your dashboard.</Text>
            </div>

            <div className="flex justify-center">
                <OrganizationSwitcher />
            </div>
        </div>
    );
};
