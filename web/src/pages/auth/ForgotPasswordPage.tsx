import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { message, Card, Typography, Result, Button } from 'antd';
import { ForgotPasswordForm, type ForgotPasswordValues } from '@web/src/components/auth/ForgotPasswordForm';
import { useForgotPassword } from '@web/src/hooks/auth/useAuth';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { mutate: forgotPassword, isPending } = useForgotPassword();
    const [emailSent, setEmailSent] = useState(false);
    const [sentEmail, setSentEmail] = useState('');

    const handleForgotPassword = (values: ForgotPasswordValues) => {
        forgotPassword({
            email: values.email,
            redirectTo: `${window.location.origin}${links.auth.resetPassword}`,
        }, {
            onSuccess: () => {
                setEmailSent(true);
                setSentEmail(values.email);
            },
            onError: (error) => {
                message.error(error.message || "Failed to send password reset email");
            }
        });
    };

    if (emailSent) {
        return (
            <Card style={{ width: 400, margin: '0 auto' }}>
                <Result
                    status="success"
                    title="Check your email"
                    subTitle={
                        <div style={{ marginBottom: 24 }}>
                            We've sent a password reset link to <Text strong>{sentEmail}</Text>.
                            <br />
                            Please check your inbox and click the link to reset your password.
                        </div>
                    }
                    extra={[
                        <Button key="signin" onClick={() => navigate(links.auth.signIn)} block>
                            Back to Sign In
                        </Button>,
                    ]}
                    style={{ padding: '0 0 24px 0' }}
                />
            </Card>
        );
    }

    return (
        <Card style={{ width: 400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={2}>Forgot Password?</Title>
                <Text type="secondary">Enter your email to receive a password reset link</Text>
            </div>
            <ForgotPasswordForm onSubmit={handleForgotPassword} isLoading={isPending} />
        </Card>
    );
};
