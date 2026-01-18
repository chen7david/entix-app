import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Result } from 'antd';
import { useSearchParams, useNavigate } from 'react-router';
import { useAcceptInvitation } from '@web/src/hooks/auth/organization.hook';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const AcceptInvitationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const invitationId = searchParams.get('id');
    const navigate = useNavigate();
    const { mutate: acceptInvitation, isPending } = useAcceptInvitation();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!invitationId) {
            setError("Invalid invitation link");
            return;
        }
    }, [invitationId]);

    const handleAccept = () => {
        if (!invitationId) return;

        acceptInvitation({ invitationId }, {
            onSuccess: () => {
                setSuccess(true);
                setTimeout(() => {
                    navigate(links.dashboard.index);
                }, 2000);
            },
            onError: (err) => {
                setError(err.message);
            }
        });
    };

    if (success) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Card className="w-full max-w-md shadow-lg text-center">
                    <Result
                        status="success"
                        title="Invitation Accepted!"
                        subTitle="You have successfully joined the organization. Redirecting..."
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md shadow-lg text-center p-8">
                <div className="mb-8">
                    <Title level={3}>Join Organization</Title>
                    <Text type="secondary">You have been invited to join an organization.</Text>
                </div>

                {error ? (
                    <Result
                        status="error"
                        title="Invitation Failed"
                        subTitle={error}
                        extra={[
                            <Button type="primary" key="home" onClick={() => navigate(links.dashboard.index)}>
                                Go Home
                            </Button>
                        ]}
                    />
                ) : (
                    <div className="space-y-4">
                        <Text>Click the button below to accept the invitation.</Text>
                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handleAccept}
                            loading={isPending}
                            disabled={!invitationId}
                        >
                            Accept Invitation
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
