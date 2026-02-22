import React from 'react';
import { Typography, Card, Statistic, Row, Col, Button, Table, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { AppstoreOutlined, TeamOutlined, PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined, SelectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const GlobalOrganizationsPage: React.FC = () => {
    const navigate = useNavigate();

    const { data: organizations, isLoading } = useQuery({
        queryKey: ['admin', 'organizations'],
        queryFn: async () => {
            const res = await fetch('/api/v1/admin/organizations', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch organizations');
            }
            const data = await res.json();
            return data.organizations;
        },
    });

    const totalOrgs = organizations?.length || 0;

    const columns = [
        {
            title: 'Organization',
            key: 'name',
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: '#e8e8e8',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                    }}>
                        {record.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="font-medium flex items-center gap-2">
                            {record.name}
                        </div>
                        <div className="text-xs text-gray-500">{record.slug}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('MMM D, YYYY'),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => {
                const items: MenuProps['items'] = [
                    {
                        key: 'goto',
                        label: 'Go to Workspace',
                        icon: <SelectOutlined />,
                        onClick: () => navigate(`/org/${record.slug}/dashboard`),
                    },
                    {
                        key: 'edit',
                        label: 'Edit Organization',
                        icon: <EditOutlined />,
                        disabled: true, // Requires full form implementation
                    },
                    {
                        key: 'delete',
                        label: 'Delete Workspace',
                        icon: <DeleteOutlined />,
                        danger: true,
                        disabled: true, // Destructive action, safely disabled for now
                    },
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
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} style={{ marginBottom: 4 }}>Global Organizations</Title>
                    <Text type="secondary">Manage all tenant workspaces across the platform</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} disabled={true}>
                    Provision New Workspace
                </Button>
            </div>

            <Row gutter={16} className="mb-8">
                <Col xs={24} sm={12}>
                    <Card loading={isLoading} className="bg-gray-50/50 border-transparent">
                        <Statistic
                            title="Total Workspaces"
                            value={totalOrgs}
                            prefix={<AppstoreOutlined className="text-blue-500" />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12}>
                    <Card loading={isLoading} className="bg-gray-50/50 border-transparent">
                        <Statistic
                            title="Active Members"
                            value="-" // Requires aggregation query
                            prefix={<TeamOutlined className="text-green-500" />}
                        />
                    </Card>
                </Col>
            </Row>

            <div className="bg-white rounded-lg">
                <Table
                    columns={columns}
                    dataSource={organizations}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        </div>
    );
};
