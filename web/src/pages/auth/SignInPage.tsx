import React from 'react';
import { useNavigate } from 'react-router';
import { message, Card, Typography } from 'antd';
import { SignInForm, type SignInValues } from '@web/src/components/auth/SignInForm';
import { useSignIn } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const SignInPage: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: signIn, isPending } = useSignIn();

    const handleSignIn = (values: SignInValues) => {
        signIn({
            email: values.email,
            password: values.password,
        }, {
            onSuccess: () => {
                message.success('Signed in successfully!');
                navigate(links.dashboard.profile);
            },
            onError: (error) => {
                message.error(error.message || "Failed to sign in");
            }
        });
    };

    return (
        <Card style={{ width: 400, margin: '0 auto', marginTop: 50 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={2}>Welcome Back</Title>
                <Text type="secondary">Please sign in to continue</Text>
            </div>
            <SignInForm onSubmit={handleSignIn} isLoading={isPending} />
        </Card>
    );
};
