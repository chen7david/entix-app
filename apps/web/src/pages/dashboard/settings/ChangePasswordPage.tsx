import { AppRoutes } from "@shared";
import {
    ChangePasswordForm,
    type ChangePasswordValues,
    useChangePassword,
} from "@web/src/features/auth";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
// Removed useNavigate
import { App, Card, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const ChangePasswordPage: React.FC = () => {
    const { notification } = App.useApp();
    const navigateOrg = useOrgNavigate();
    const { activeOrganization } = useOrganization();
    const { mutate: changePassword, isPending } = useChangePassword();

    const handleChangePassword = (values: ChangePasswordValues) => {
        changePassword(
            {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                revokeOtherSessions: values.revokeOtherSessions,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Password Changed",
                        description: "Your password has been changed successfully.",
                    });
                    setTimeout(() => {
                        if (activeOrganization?.slug) {
                            navigateOrg(AppRoutes.org.dashboard.settings);
                        } else {
                            navigateOrg(-1); // Fallback
                        }
                    }, 1500);
                },
                onError: (error) => {
                    notification.error({
                        message: "Update Failed",
                        description: error.message || "Failed to change password",
                    });
                },
            }
        );
    };

    return (
        <div className="max-w-xl">
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Change Password
                </Title>
                <Text type="secondary">Update your password to keep your account secure</Text>
            </div>

            <Card className="shadow-sm">
                <ChangePasswordForm onSubmit={handleChangePassword} isLoading={isPending} />
            </Card>
        </div>
    );
};
