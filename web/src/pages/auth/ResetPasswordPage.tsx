import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { message, Card, Typography, Result, Button } from 'antd';
import { ResetPasswordForm, type ResetPasswordValues } from '@web/src/components/auth/ResetPasswordForm';
import { useResetPassword } from '@web/src/hooks/auth/useAuth';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'idle' | 'success' | 'invalid'>('idle');

    const { mutate: resetPassword, isPending } = useResetPassword();

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
        }
    }, [token]);

    const handleResetPassword = (values: ResetPasswordValues) => {
        if (!token) {
            message.error("Invalid reset token");
            return;
        }

        resetPassword({
            newPassword: values.newPassword,
            token,
        }, {
            onSuccess: () => {
                setStatus('success');
                message.success('Password reset successfully!');
                setTimeout(() => {
                    navigate(links.auth.signIn);
                }, 3000);
            },
            onError: (error) => {
                message.error(error.message || "Failed to reset password");
            }
        });
    };

    if (status === 'invalid') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Result
                    status="error"
                    title="Invalid Reset Link"
                    subTitle="The password reset link is invalid or has expired."
                    extra={[
                        <Button type="primary" key="forgot" onClick={() => navigate(links.auth.forgotPassword)}>
                            Request New Link
                        </Button>,
                        <Button key="signin" onClick={() => navigate(links.auth.signIn)}>
                            Back to Sign In
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Result
                    status="success"
                    title="Password Reset Successfully!"
                    subTitle="Redirecting you to sign in..."
                    extra={[
                        <Button type="primary" key="signin" onClick={() => navigate(links.auth.signIn)}>
                            Go to Sign In
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <Card style={{ width: 400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={2}>Reset Password</Title>
                <Text type="secondary">Enter your new password</Text>
            </div>
            <ResetPasswordForm onSubmit={handleResetPassword} isLoading={isPending} />
        </Card>
    );
};
