import React from 'react';
import { List, Skeleton, message } from 'antd';
import { useListOrganizations, useSetActiveOrganization, useActiveOrganization } from '@web/src/hooks/auth/organization.hook';
import { OrganizationListItem } from './OrganizationListItem';

export const OrganizationList: React.FC = () => {
    const { data: organizations, isPending, error } = useListOrganizations();
    const { data: activeOrg } = useActiveOrganization();
    const { mutate: setActive, isPending: isSettingActive } = useSetActiveOrganization();

    const handleSetActive = (orgId: string) => {
        setActive({ organizationId: orgId }, {
            onSuccess: () => {
                message.success('Active organization updated');
                window.location.reload();
            },
            onError: (error) => {
                message.error(error.message);
            }
        });
    };

    if (error) {
        return <div className="p-4 text-red-500">Error loading organizations: {error.message}</div>;
    }

    if (isPending) {
        return <Skeleton active paragraph={{ rows: 3 }} />;
    }

    return (
        <List
            itemLayout="horizontal"
            dataSource={organizations || undefined}
            renderItem={(org) => (
                <OrganizationListItem
                    org={org}
                    isActive={activeOrg?.id === org.id}
                    onSetActive={handleSetActive}
                    isSettingActive={isSettingActive}
                />
            )}
        />
    );
};
