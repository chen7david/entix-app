import React from 'react';
import { Card, Typography, message, Divider } from 'antd';
import { ChangePasswordForm, type ChangePasswordValues } from '@web/src/components/auth/ChangePasswordForm';
import { useChangePassword } from '@web/src/hooks/auth/auth.hook';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
    const { mutate: changePassword, isPending } = useChangePassword();

    const handleChangePassword = (values: ChangePasswordValues) => {
        changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            revokeOtherSessions: values.revokeOtherSessions,
        }, {
            onSuccess: () => {
                message.success('Password changed successfully!');
            },
            onError: (error) => {
                message.error(error.message || "Failed to change password");
            }
        });
    };

    return (
        <>
            <Toolbar />
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <Card>
                    <Title level={3}>Settings</Title>
                    <Text type="secondary">Manage your account settings and preferences</Text>

                    <Divider />

                    <Title level={4}>Change Password</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        Update your password to keep your account secure
                    </Text>

                    <ChangePasswordForm onSubmit={handleChangePassword} isLoading={isPending} />
                </Card>
            </div>
        </>
    );
};
