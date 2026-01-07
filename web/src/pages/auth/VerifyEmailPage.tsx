import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Typography, Spin, Button, Result } from 'antd';
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
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <Spin size="large" />
                    <div className="mt-4">
                        <Text>Verifying your email...</Text>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Result
                    status="success"
                    title="Email Verified Successfully!"
                    subTitle="Redirecting you to the dashboard..."
                    extra={[
                        <Button type="primary" key="dashboard" onClick={() => navigate(links.dashboard.index)}>
                            Go to Dashboard
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Result
                status="error"
                title="Verification Failed"
                subTitle="The verification link is invalid or has expired."
                extra={[
                    <Button type="primary" key="signin" onClick={() => navigate(links.auth.signIn)}>
                        Go to Sign In
                    </Button>,
                ]}
            />
        </div>
    );
};
