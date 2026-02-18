import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Typography, Spin, Button, Result, Card, message } from 'antd';
import { useVerifyEmail } from '@web/src/hooks/auth/auth.hook';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const { checkOrganizationStatus } = useOrganization();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(token ? 'verifying' : 'error');

    const { mutate: verify } = useVerifyEmail();

    useEffect(() => {
        if (!token) {
            return;
        }

        verify({
            query: {
                token,
            },
        }, {
            onSuccess: (response) => {
                const data = response.data as any; // Cast to avoid strict type checks here if type definitions are incomplete
                if (data?.status) {
                    message.success("Email verified successfully!");
                    // Check org status to redirect appropriately
                    checkOrganizationStatus();
                } else {
                    setStatus('success');
                    setTimeout(() => {
                        navigate(links.auth.signIn);
                    }, 3000);
                }
            },
            onError: () => {
                setStatus('error');
            }
        });
    }, [token, navigate, verify, checkOrganizationStatus]);

    if (status === 'verifying') {
        return (
            <Card style={{ width: 400, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 24 }}>
                        <Text>Verifying your email...</Text>
                    </div>
                </div>
            </Card>
        );
    }

    if (status === 'success') {
        return (
            <Card style={{ width: 400, margin: '0 auto' }}>
                <Result
                    status="success"
                    title="Email Verified Successfully!"
                    subTitle="Redirecting you..."
                    extra={[
                        <Button type="primary" key="dashboard" onClick={() => checkOrganizationStatus()} block>
                            Continue
                        </Button>,
                    ]}
                    style={{ padding: '0 0 24px 0' }}
                />
            </Card>
        );
    }

    return (
        <Card style={{ width: 400, margin: '0 auto' }}>
            <Result
                status="error"
                title="Verification Failed"
                subTitle="The verification link is invalid or has expired."
                extra={[
                    <Button type="primary" key="signin" onClick={() => navigate(links.auth.signIn)} block>
                        Go to Sign In
                    </Button>,
                ]}
                style={{ padding: '0 0 24px 0' }}
            />
        </Card>
    );
};
