import { AppRoutes } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import {
    ChangePasswordForm,
    type ChangePasswordValues,
    useChangePassword,
} from "@web/src/features/auth";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { App, Card } from "antd";
import type React from "react";

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
                            navigateOrg(-1);
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
        <PageShell fill={false}>
            <PageHeader
                title="Change Password"
                subtitle="Update your password to keep your account secure."
            />
            <Card className="border-0 shadow-sm max-w-xl">
                <ChangePasswordForm onSubmit={handleChangePassword} isLoading={isPending} />
            </Card>
        </PageShell>
    );
};
