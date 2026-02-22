import React from 'react';
import { Typography, Spin } from 'antd';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { OrganizationSwitcher } from '@web/src/components/organization/OrganizationSwitcher';
import { useNavigate } from 'react-router';


const { Title, Text } = Typography;

export const SelectOrganizationPage: React.FC = () => {
    const { loading, activeOrganization, checkOrganizationStatus } = useOrganization();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (activeOrganization) {
            if (activeOrganization) {
                checkOrganizationStatus(); // Use checkOrganizationStatus to navigate
            }
        }
    }, [activeOrganization, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
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
                    <Title level={3} style={{ marginBottom: 8 }}>Select Organization</Title>
                    <Text type="secondary">Choose an organization to continue to your dashboard</Text>
                </div>

                <div className="flex justify-center">
                    <OrganizationSwitcher
                        allowCreate={false}
                        afterSelect={() => checkOrganizationStatus()}
                    />
                </div>
            </div>
        </div>
    );
};
