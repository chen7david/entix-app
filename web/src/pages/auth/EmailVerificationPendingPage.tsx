import React, { useState } from 'react';
import { Card, Typography, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { authClient } from '@web/src/lib/auth-client';
import { useLocation } from 'react-router';

const { Title, Text } = Typography;

export const EmailVerificationPendingPage: React.FC = () => {
    const location = useLocation();
    const email = location.state?.email; // Expect email to be passed in state
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        if (!email) {
            message.error("Email address not found. Please sign in again.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await authClient.sendVerificationEmail({
                email,
            });

            if (error) {
                message.error(error.message || "Failed to resend verification email.");
            } else {
                message.success("Verification email sent!");
            }
        } catch {
            message.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full text-center shadow-md">
                <div className="mb-6">
                    <MailOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </div>
                <Title level={3}>Check your email</Title>
                <div className="mb-6">
                    <Text>
                        We've sent a verification link to <Text strong>{email || 'your email address'}</Text>.
                    </Text>
                    <br />
                    <Text type="secondary">
                        Please check your inbox and click the link to verify your account.
                    </Text>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        type="default"
                        onClick={handleResend}
                        loading={loading}
                        disabled={!email}
                    >
                        Resend Email
                    </Button>
                    <Text type="secondary" className="text-xs">
                        Did not receive the email? Check your spam folder.
                    </Text>
                </div>
            </Card>
        </div>
    );
};
