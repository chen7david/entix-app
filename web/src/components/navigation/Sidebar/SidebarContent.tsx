import {
    LogoutOutlined,
    MoreOutlined,
    SafetyOutlined,
    SettingOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared/constants/routes";
import { getAvatarUrl } from "@shared/utils/image-url";
import { useAuth, useSignOut } from "@web/src/hooks/auth/useAuth";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Avatar, Button, Dropdown, type MenuProps, Skeleton, Typography, theme } from "antd";
import type React from "react";
import { useNavigate } from "react-router";
import { SidebarMenu } from "./SidebarMenu";
import { SidebarOrgSwitcher } from "./SidebarOrgSwitcher";

const { Text } = Typography;

export const SidebarContent: React.FC = () => {
    const { session, isLoading, isSuperAdmin } = useAuth();
    const { mutate: signOut } = useSignOut();
    const { activeOrganization } = useOrganization();
    const navigate = useNavigate();
    const slug = activeOrganization?.slug || "";
    const { token } = theme.useToken();

    const handleMenuClick: MenuProps["onClick"] = (e) => {
        if (e.key === "logout") {
            signOut(undefined, {
                onSuccess: () => {
                    navigate(AppRoutes.auth.signIn);
                },
            });
        } else {
            navigate(e.key);
        }
    };

    const userMenuItems: MenuProps["items"] = [
        ...(isSuperAdmin
            ? [
                  {
                      key: AppRoutes.admin.index,
                      label: "Admin Management",
                      icon: <SafetyOutlined style={{ color: "#faad14" }} />,
                  },
                  {
                      type: "divider" as const,
                  },
              ]
            : []),
        ...(slug
            ? [
                  {
                      key: slug
                          ? `/org/${slug}${AppRoutes.org.dashboard.profile}`
                          : "profile-disabled",
                      label: "Profile",
                      icon: <UserOutlined />,
                  },
                  {
                      key: slug
                          ? `/org/${slug}${AppRoutes.org.dashboard.sessions}`
                          : "sessions-disabled",
                      label: "Sessions",
                      icon: <SafetyOutlined />,
                  },
                  {
                      key: slug
                          ? `/org/${slug}${AppRoutes.org.dashboard.settings}`
                          : "settings-disabled",
                      label: "Settings",
                      icon: <SettingOutlined />,
                  },
                  {
                      type: "divider" as const,
                  },
              ]
            : []),
        {
            key: "logout",
            label: "Sign Out",
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* User Profile (Top) */}
            <div className="p-4">
                {isLoading ? (
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                ) : (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar
                            size={40}
                            src={
                                session.data?.user?.image
                                    ? getAvatarUrl(session.data?.user?.image, "sm")
                                    : undefined
                            }
                            icon={<UserOutlined />}
                            className="flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <Text strong className="truncate text-sm">
                                {session.data?.user?.name}
                            </Text>
                            <Text type="secondary" className="truncate text-xs">
                                {session.data?.user?.email}
                            </Text>
                        </div>
                    </div>
                )}
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <SidebarMenu />
            </div>

            {/* Footer: Org Switcher & User Menu */}
            <div style={{ borderTop: `1px solid ${token.colorSplit}` }}>
                <div className="flex items-center gap-1 p-2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SidebarOrgSwitcher />
                    </div>
                    <Dropdown
                        menu={{ items: userMenuItems, onClick: handleMenuClick }}
                        trigger={["click"]}
                        placement="topRight"
                    >
                        <Button type="text" icon={<MoreOutlined />} className="flex-shrink-0" />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};
