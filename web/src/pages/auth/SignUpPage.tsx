import React from 'react';
import { useNavigate } from 'react-router';
import { message, Card, Typography } from 'antd';
import { SignUpForm, type SignUpValues } from '@web/src/components/auth/SignUpForm';
import { useSignUp } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: signUp, isPending } = useSignUp();

    const handleSignUp = (values: SignUpValues) => {
        signUp({
            email: values.email,
            password: values.password,
            name: values.name,
        }, {
            onSuccess: () => {
                message.success('Account created! Please check your email for verification.');
                navigate(links.auth.emailVerificationPending, { state: { email: values.email } });
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
            <SignUpForm onSubmit={handleSignUp} isLoading={isPending} />
        </Card>
    );
};
