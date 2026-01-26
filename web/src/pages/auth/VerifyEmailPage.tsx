import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Typography, Spin, Button, Result, Card } from 'antd';
import { useVerifyEmail } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
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
            onSuccess: () => {
                setStatus('success');
                setTimeout(() => {
                    navigate(links.dashboard.index);
                }, 3000);
            },
            onError: () => {
                setStatus('error');
            }
        });
    }, [token, navigate, verify]);

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
                    subTitle="Redirecting you to the dashboard..."
                    extra={[
                        <Button type="primary" key="dashboard" onClick={() => navigate(links.dashboard.index)} block>
                            Go to Dashboard
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
