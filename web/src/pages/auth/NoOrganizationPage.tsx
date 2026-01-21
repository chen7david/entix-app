import React from 'react';
import { Card, Typography, Button } from 'antd';
import { useSignOut } from '@web/src/hooks/auth/auth.hook';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Title, Paragraph } = Typography;

export const NoOrganizationPage: React.FC = () => {
    const { mutate: signOut } = useSignOut();
    const navigate = useNavigate();

    const handleSignOut = () => {
        signOut(undefined, {
            onSuccess: () => {
                navigate(links.auth.signIn);
            }
        });
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md text-center shadow-lg">
                <Title level={3}>No Organization Found</Title>
                <Paragraph className="mb-6 text-gray-600">
                    You are not a member of any organization. Please contact your site administrator to request an invitation.
                </Paragraph>
                <Button type="primary" onClick={handleSignOut} block>
                    Sign Out
                </Button>
            </Card>
        </div>
    );
};
