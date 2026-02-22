import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useMembers } from "@web/src/hooks/auth/useMembers";
import { useInvitations } from "@web/src/hooks/auth/useInvitations";
import { Table, Button, Typography, Skeleton, Modal, Statistic, Row, Col, Card, Tag, Input, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { PlusOutlined, TeamOutlined, MailOutlined, AppstoreOutlined, SearchOutlined, MoreOutlined, EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import { CreateOrganizationForm } from "@web/src/components/organization/CreateOrganizationForm";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const OrganizationListPage = () => {
    const { organizations, loading, activeOrganization } = useOrganization();
    const { members } = useMembers();
    const { invitations } = useInvitations();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Sort: active org on top
    const sortedOrgs = [...(organizations || [])].sort((a, b) => {
        if (a.id === activeOrganization?.id) return -1;
        if (b.id === activeOrganization?.id) return 1;
        return 0;
    });

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
                        background: record.id === activeOrganization?.id ? '#646cff' : '#e8e8e8',
                        color: record.id === activeOrganization?.id ? '#fff' : '#666',
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
                            {record.id === activeOrganization?.id && (
                                <Tag color="purple" style={{ fontSize: 11 }}>Active</Tag>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">{record.slug}</div>
                    </div>
                </div>
            ),
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value: any, record: any) =>
                record.name.toLowerCase().includes(value.toLowerCase()) ||
                record.slug.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            responsive: ['md' as const],
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('MMM D, YYYY'),
            responsive: ['lg' as const],
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => {
                const items: MenuProps['items'] = [
                    {
                        key: 'view',
                        label: 'View Details',
                        icon: <EyeOutlined />,
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

    if (loading) {
        return (
            <>
                <Toolbar />
                <div className="p-6">
                    <Skeleton active />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>Manage Organizations</Title>
                        <Text type="secondary">View and manage your organizations</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Create Organization
                    </Button>
                </div>

                {/* Stats Cards */}
                <Row gutter={16} className="mb-6">
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Current Organization"
                                value={activeOrganization?.name || 'None'}
                                prefix={<AppstoreOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Members"
                                value={members?.length || 0}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Pending Invitations"
                                value={invitations?.length || 0}
                                prefix={<MailOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search organizations..."
                        prefix={<SearchOutlined />}
                        className="max-w-xs"
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                {/* Organizations Table */}
                <Table
                    columns={columns}
                    dataSource={sortedOrgs}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />

                {/* Create Organization Modal */}
                <Modal
                    title="Create Organization"
                    open={isCreateModalOpen}
                    onCancel={() => setIsCreateModalOpen(false)}
                    footer={null}
                >
                    <CreateOrganizationForm onSuccess={() => setIsCreateModalOpen(false)} />
                </Modal>
            </div>
        </>
    );
};
