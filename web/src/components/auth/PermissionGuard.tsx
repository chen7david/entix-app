import React from 'react';
import { usePermission } from '../../hooks/auth/usePermission';
import { Permission } from '../../../../shared/types/auth-types';
import { Spin } from 'antd';

interface PermissionGuardProps {
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showLoading?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    children,
    fallback = null,
    showLoading = false
}) => {
    const { hasPermission, isLoading } = usePermission();

    if (isLoading && showLoading) {
        return <div className="flex justify-center p-4"><Spin /></div>;
    }

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
