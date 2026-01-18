import React from 'react';
import { List, Button, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

interface Organization {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    metadata?: any;
    createdAt: Date;
}

interface OrganizationListItemProps {
    org: Organization;
    isActive: boolean;
    onSetActive: (orgId: string) => void;
    isSettingActive: boolean;
}

export const OrganizationListItem: React.FC<OrganizationListItemProps> = ({
    org,
    isActive,
    onSetActive,
    isSettingActive
}) => {
    return (
        <List.Item
            actions={[
                isActive ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
                ) : (
                    <Button
                        type="link"
                        onClick={() => onSetActive(org.id)}
                        disabled={isSettingActive}
                    >
                        Switch
                    </Button>
                )
            ]}
        >
            <List.Item.Meta
                title={<span className="font-medium">{org.name}</span>}
                description={`Slug: ${org.slug}`}
                avatar={
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 uppercase">
                        {org.name.charAt(0)}
                    </div>
                }
            />
        </List.Item>
    );
};
