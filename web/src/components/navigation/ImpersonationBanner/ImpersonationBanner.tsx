import React from 'react';
import { Button, Alert, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useSession } from '@web/src/lib/auth-client';
import { useStopImpersonating } from '@web/src/hooks/auth/useAuth';

export const ImpersonationBanner: React.FC = () => {
    const { data, isPending: isSessionPending } = useSession();
    const { mutate: stopImpersonating, isPending: isStopping } = useStopImpersonating();

    // Better Auth injects `impersonatedBy` into the session object during impersonation
    const session = data?.session as any;

    if (isSessionPending || !session || !session.impersonatedBy) {
        return null; // Don't render if not impersonating
    }

    const handleStopImpersonation = () => {
        stopImpersonating(undefined, {
            onError: (error) => {
                message.error(error.message);
                console.error('Failed to stop impersonation', error);
            }
        });
    };

    return (
        <Alert
            message={
                <div className="flex justify-between items-center w-full px-2 py-1">
                    <div className="flex items-center gap-2 font-medium">
                        <UserOutlined />
                        <span>You are currently impersonating {data?.user?.name || data?.user?.email}</span>
                    </div>
                    <Button
                        type="primary"
                        danger
                        size="small"
                        loading={isStopping}
                        onClick={handleStopImpersonation}
                        className="font-semibold"
                    >
                        Stop Impersonating
                    </Button>
                </div>
            }
            type="warning"
            showIcon={false}
            banner
            className="w-full z-[1000] sticky top-0 border-b border-warning-border"
        />
    );
};
