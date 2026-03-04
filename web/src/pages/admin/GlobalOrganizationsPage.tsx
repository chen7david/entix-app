import React, { useState } from 'react';
import { Typography, Card, Statistic, Row, Col, Button, Table, Modal, Tag, Input, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
    ApartmentOutlined,
    PlusOutlined,
    UserAddOutlined,
    SearchOutlined,
    MoreOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { CreateOrganizationForm } from '@web/src/components/organization/CreateOrganizationForm';
import { SignUpWithOrgForm, type SignUpWithOrgValues } from '@web/src/components/auth/SignUpWithOrgForm';
import { useAdminOrganizations, useAdminCreateUserWithOrg } from '@web/src/hooks/admin/useAdminOrganizations';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const GlobalOrganizationsPage: React.FC = () => {
    const { data: organizations = [], isLoading, refetch } = useAdminOrganizations();
    const { mutate: createUserWithOrg, isPending: isCreatingUserWithOrg } = useAdminCreateUserWithOrg();

    const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
    const [isCreateUserWithOrgModalOpen, setIsCreateUserWithOrgModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    const filteredOrgs = organizations.filter((org: any) =>
        org.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        org.slug?.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleCreateUserWithOrg = (values: SignUpWithOrgValues) => {
        createUserWithOrg(values, {
            onSuccess: () => {
                message.success(`Organization "${values.organizationName}" and user created successfully`);
                setIsCreateUserWithOrgModalOpen(false);
            },
            onError: (error: Error) => {
                message.error(error.message || 'Failed to create user and organization');
            },
        });
    };

    const columns = [
        {
            title: 'Organization',
            key: 'name',
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#646cff',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        fontWeight: 700,
                        flexShrink: 0,
                    }}>
                        {record.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-xs text-gray-500">{record.slug}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug: string) => <Tag>{slug}</Tag>,
            responsive: ['md' as const],
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <CalendarOutlined />
                    {dayjs(date).format('MMM D, YYYY')}
                </span>
            ),
            responsive: ['lg' as const],
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 60,
            render: () => {
                const items: MenuProps['items'] = [
                    { key: 'view', label: 'View Details' },
                ];
                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <>
            <Toolbar />
            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>Global Organizations</Title>
                        <Text type="secondary">Manage all platform organizations and their owners</Text>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateOrgModalOpen(true)}
                        >
                            Create Organization
                        </Button>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => setIsCreateUserWithOrgModalOpen(true)}
                        >
                            Create User + Org
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <Row gutter={16} className="mb-8">
                    <Col xs={24} sm={8}>
                        <Card loading={isLoading} className="border-gray-200 shadow-sm">
                            <Statistic
                                title="Total Organizations"
                                value={organizations.length}
                                prefix={<ApartmentOutlined className="text-blue-500" />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search organizations by name or slug..."
                        prefix={<SearchOutlined />}
                        className="max-w-sm"
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={filteredOrgs}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 15, showSizeChanger: false }}
                />
            </div>

            {/* Create Organization Modal */}
            <Modal
                title="Create Organization"
                open={isCreateOrgModalOpen}
                onCancel={() => setIsCreateOrgModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <CreateOrganizationForm
                    onSuccess={() => {
                        setIsCreateOrgModalOpen(false);
                        refetch();
                    }}
                />
            </Modal>

            {/* Create User + Organization Modal */}
            <Modal
                title="Create User & Organization"
                open={isCreateUserWithOrgModalOpen}
                onCancel={() => setIsCreateUserWithOrgModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <div className="mb-4">
                    <Text type="secondary">
                        Creates a new user account and a new organization. The user becomes the owner of the organization and receives a password reset email.
                    </Text>
                </div>
                <SignUpWithOrgForm
                    onSubmit={handleCreateUserWithOrg}
                    isLoading={isCreatingUserWithOrg}
                />
            </Modal>
        </>
    );
};
