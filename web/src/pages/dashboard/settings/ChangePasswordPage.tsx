import { AppRoutes } from "@shared/constants/routes";
import {
    ChangePasswordForm,
    type ChangePasswordValues,
} from "@web/src/components/auth/ChangePasswordForm";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useChangePassword } from "@web/src/hooks/auth/useAuth";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useOrgNavigate } from "@web/src/hooks/navigation/useOrgNavigate";
// Removed useNavigate
import { App, Card, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const ChangePasswordPage: React.FC = () => {
    const { message } = App.useApp();
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
                    message.success("Password changed successfully!");
                    setTimeout(() => {
                        if (activeOrganization?.slug) {
                            navigateOrg(AppRoutes.org.dashboard.settings);
                        } else {
                            navigateOrg(-1); // Fallback
                        }
                    }, 1500);
                },
                onError: (error) => {
                    message.error(error.message || "Failed to change password");
                },
            }
        );
    };

    return (
        <>
            <Toolbar />
            <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
                <Card>
                    <Title level={3}>Change Password</Title>
                    <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
                        Update your password to keep your account secure
                    </Text>

                    <ChangePasswordForm onSubmit={handleChangePassword} isLoading={isPending} />
                </Card>
            </div>
        </>
    );
};
