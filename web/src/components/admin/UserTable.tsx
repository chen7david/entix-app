import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Button, Input, Modal, message, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { SearchOutlined, MoreOutlined, StopOutlined, CheckCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { authClient } from '@web/src/lib/auth-client';
import dayjs from 'dayjs';

export const UserTable: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const {
        data: users,
        isPending,
        refetch
    } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const res = await authClient.admin.listUsers({
                query: {
                    limit: 100,
                }
            });
            if (res.error) throw res.error;
            return res.data.users;
        }
    });

    const handleImpersonate = async (userId: string) => {
        await authClient.admin.impersonateUser({
            userId,
        }, {
            onSuccess: () => {
                message.success('Impersonation started');
                window.location.href = '/'; // Redirect to root, auth flow will route to correct dashboard
            },
            onError: (ctx) => {
                message.error(ctx.error.message);
            }
        });
    };

    const handleBanUser = async (userId: string) => {
        Modal.confirm({
            title: 'Ban User',
            content: 'Are you sure you want to ban this user?',
            onOk: async () => {
                await authClient.admin.banUser({
                    userId,
                    banReason: 'Admin action',
                });
                message.success('User banned');
                refetch();
            }
        });
    };

    const handleUnbanUser = async (userId: string) => {
        await authClient.admin.unbanUser({
            userId,
        });
        message.success('User unbanned');
        refetch();
    };

    const handleSetRole = async (userId: string, role: string) => {
        await authClient.admin.setRole({
            userId,
            role: role as "user" | "admin",
        });
        message.success('Role updated');
        refetch();
    };

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    {record.image && <img src={record.image} alt={record.name} className="w-8 h-8 rounded-full" />}
                    <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-xs text-gray-500">{record.email}</div>
                    </div>
                </div>
            ),
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value: any, record: any) =>
                record.name.toLowerCase().includes(value.toLowerCase()) ||
                record.email.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: any) => (
                record.banned ? <Tag color="error">BANNED</Tag> : <Tag color="success">ACTIVE</Tag>
            ),
        },
        {
            title: 'Joined',
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
                        key: 'impersonate',
                        label: 'Impersonate',
                        icon: <UserSwitchOutlined />,
                        onClick: () => handleImpersonate(record.id),
                    },
                    {
                        key: 'role',
                        label: record.role === 'admin' ? 'Demote to User' : 'Promote to Admin',
                        onClick: () => handleSetRole(record.id, record.role === 'admin' ? 'user' : 'admin'),
                    },
                    {
                        key: 'ban',
                        label: record.banned ? 'Unban User' : 'Ban User',
                        icon: record.banned ? <CheckCircleOutlined /> : <StopOutlined />,
                        danger: !record.banned,
                        onClick: () => record.banned ? handleUnbanUser(record.id) : handleBanUser(record.id),
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
        <div className="space-y-4">
            <Input
                placeholder="Search users..."
                prefix={<SearchOutlined />}
                className="max-w-xs"
                onChange={e => setSearchText(e.target.value)}
            />
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={isPending}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};
