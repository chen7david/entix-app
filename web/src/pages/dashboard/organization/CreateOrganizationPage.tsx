import React from 'react';
import { Card, Typography } from 'antd';
import { CreateOrganizationForm } from '@web/src/components/organization/CreateOrganizationForm';

const { Title, Text } = Typography;

export const CreateOrganizationPage: React.FC = () => {
    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md shadow-lg">
                <div className="text-center mb-6">
                    <Title level={2}>Create Organization</Title>
                    <Text type="secondary">Create a new organization to collaborate with your team.</Text>
                </div>
                <CreateOrganizationForm />
            </Card>
        </div>
    );
};
