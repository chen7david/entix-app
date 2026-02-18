import React from 'react';
import { Card, Typography, Button, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useResendVerification } from '@web/src/hooks/auth/useAuth';
import { useLocation, useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const EmailVerificationPendingPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email; // Expect email to be passed in state
    const { mutate: resend, isPending } = useResendVerification();

    const handleResend = () => {
        if (!email) {
            message.error("Email address not found. Please sign in again.");
            return;
        }

        resend({
            email,
        }, {
            onSuccess: () => {
                message.success("Verification email sent!");
            },
            onError: (error) => {
                message.error(error.message || "Failed to resend verification email.");
            }
        });
    };

    return (
        <Card style={{ width: 400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div className="mb-6">
                    <MailOutlined style={{ fontSize: '48px', color: '#646cff' }} />
                </div>
                <Title level={2}>Check your email</Title>
                <div style={{ marginBottom: 24 }}>
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
                        loading={isPending}
                        disabled={!email}
                        block
                    >
                        Resend Email
                    </Button>
                    <Button
                        type="default"
                        onClick={() => navigate(links.auth.signIn)}
                        block
                    >
                        Go to Sign In
                    </Button>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Did not receive the email? Check your spam folder.
                    </Text>
                </div>
            </div>
        </Card>
    );
};
