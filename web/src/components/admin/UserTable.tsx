import React, { useState } from 'react';
import { Table, Tag, Button, Input, Modal, message, Dropdown } from 'antd';
import { useAdminUsers, useBanUser, useUnbanUser, useSetUserRole, useImpersonateUser } from '@web/src/hooks/admin/useAdminUsers';
import { requestPasswordReset, sendVerificationEmail } from '@web/src/lib/auth-client';
import type { MenuProps } from 'antd';
import { SearchOutlined, MoreOutlined, StopOutlined, CheckCircleOutlined, UserSwitchOutlined, MailOutlined, KeyOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export const UserTable: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const { data: users, isPending } = useAdminUsers();

    const { mutate: impersonate } = useImpersonateUser();
    const { mutate: banUser } = useBanUser();
    const { mutate: unbanUser } = useUnbanUser();
    const { mutate: setRole } = useSetUserRole();

    const handleImpersonate = (userId: string) => {
        impersonate(userId, {
            onSuccess: () => message.success('Impersonation started'),
            onError: (error) => message.error(error.message)
        });
    };

    const handleBanUser = (userId: string) => {
        Modal.confirm({
            title: 'Ban User',
            content: 'Are you sure you want to ban this user?',
            onOk: () => {
                banUser({ userId, banReason: 'Admin action' }, {
                    onSuccess: () => message.success('User banned'),
                    onError: (error) => message.error(error.message)
                });
            }
        });
    };

    const handleUnbanUser = (userId: string) => {
        unbanUser(userId, {
            onSuccess: () => message.success('User unbanned'),
            onError: (error) => message.error(error.message)
        });
    };

    const handleSetRole = (userId: string, role: string) => {
        setRole({ userId, role: role as "user" | "admin" }, {
            onSuccess: () => message.success('Role updated'),
            onError: (error) => message.error(error.message)
        });
    };

    const handleResendPassword = async (email: string) => {
        if (!email) return;
        const { error } = await requestPasswordReset({ email, redirectTo: window.location.origin + '/auth/reset-password' });
        if (error) {
            message.error('Failed to send password reset: ' + error.message);
        } else {
            message.success('Password reset email sent');
        }
    };

    const handleResendVerification = async (email: string) => {
        if (!email) return;
        const { error } = await sendVerificationEmail({ email, callbackURL: window.location.origin });
        if (error) {
            message.error('Failed to send verification email: ' + error.message);
        } else {
            message.success('Verification email sent');
        }
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
                        icon: record.role === 'admin' ? <UserOutlined /> : <CrownOutlined />,
                        onClick: () => handleSetRole(record.id, record.role === 'admin' ? 'user' : 'admin'),
                    },
                    {
                        key: 'verify',
                        label: 'Resend Verification Email',
                        icon: <MailOutlined />,
                        onClick: () => handleResendVerification(record.email),
                    },
                    {
                        key: 'password',
                        label: 'Resend Password Reset',
                        icon: <KeyOutlined />,
                        onClick: () => handleResendPassword(record.email),
                    },
                    {
                        type: 'divider',
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
