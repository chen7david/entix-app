import React from 'react';
import { useNavigate } from 'react-router';
import { App, Card, Typography } from 'antd';
import { SignUpWithOrgForm, type SignUpWithOrgValues } from '@web/src/components/auth/SignUpWithOrgForm';
import { useSignUpWithOrg } from '@web/src/hooks/auth/useAuth';
import { AppRoutes } from '@shared/constants/routes';

const { Title, Text } = Typography;

export const SignUpPage: React.FC = () => {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const { mutate: signUp, isPending } = useSignUpWithOrg();

    const handleSignUp = (values: SignUpWithOrgValues) => {
        signUp({
            email: values.email,
            password: values.password,
            name: values.name,
            organizationName: values.organizationName,
        }, {
            onSuccess: () => {
                message.success('Account and Organization created!');
                // Navigate to dashboard or email verification depending on flow
                // For now, let's assume dashboard or email verification
                navigate(AppRoutes.auth.emailVerificationPending, { state: { email: values.email } });
            },
            onError: (error) => {
                message.error(error.message || "Failed to create account");
            }
        });
    };

    return (
        <Card style={{ width: 400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={2}>Sign Up</Title>
                <Text type="secondary">Create your account to get started</Text>
            </div>
            <SignUpWithOrgForm onSubmit={handleSignUp} isLoading={isPending} />
        </Card>
    );
};
