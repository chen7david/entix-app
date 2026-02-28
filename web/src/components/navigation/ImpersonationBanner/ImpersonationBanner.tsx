import React, { useState } from 'react';
import { Button, Alert } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { authClient, useSession } from '@web/src/lib/auth-client';

export const ImpersonationBanner: React.FC = () => {
    const { data, isPending } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    // Better Auth injects `impersonatedBy` into the session object during impersonation
    const session = data?.session as any;

    if (isPending || !session || !session.impersonatedBy) {
        return null; // Don't render if not impersonating
    }

    const handleStopImpersonation = async () => {
        setIsLoading(true);
        try {
            await authClient.admin.stopImpersonating();
            // Force a deep reload to clear all contexts and fetch the correct user session
            window.location.href = '/admin/users';
        } catch (error) {
            console.error('Failed to stop impersonation', error);
        } finally {
            setIsLoading(false);
        }
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
                        loading={isLoading}
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
