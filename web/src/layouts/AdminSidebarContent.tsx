import {
    ApartmentOutlined,
    ArrowLeftOutlined,
    DashboardOutlined,
    LogoutOutlined,
    MailOutlined,
    MoreOutlined,
    SafetyOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared/constants/routes";
import { getAvatarUrl } from "@shared/utils/image-url";
import { useAuth, useSignOut } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
import { Avatar, Button, Dropdown, Menu, type MenuProps, Typography, theme } from "antd";
import type React from "react";
import { useLocation, useNavigate } from "react-router";

const { Text } = Typography;
const { useToken } = theme;

export const AdminSidebarContent: React.FC = () => {
    const { user } = useAuth();
    const { mutate: signOut } = useSignOut();
    const { checkOrganizationStatus } = useOrganization();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useToken();

    // 1. User Profile Dropdown
    const handleMenuClick: MenuProps["onClick"] = (e) => {
        if (e.key === "logout") {
            signOut(undefined, {
                onSuccess: () => navigate(AppRoutes.auth.signIn),
            });
        } else if (e.key === "exit") {
            checkOrganizationStatus();
        }
    };

    const userMenuItems: MenuProps["items"] = [
        {
            key: "exit",
            label: "Exit Admin Portal",
            icon: <ArrowLeftOutlined />,
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            label: "Sign Out",
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    // 2. Navigation Main Menu
    const navItems: MenuProps["items"] = [
        {
            label: "System Dashboard",
            key: AppRoutes.admin.index,
            icon: <DashboardOutlined />,
        },
        {
            label: "Global Users",
            key: AppRoutes.admin.users,
            icon: <TeamOutlined />,
        },
        {
            label: "Global Organizations",
            key: AppRoutes.admin.organizations,
            icon: <ApartmentOutlined />,
        },
        {
            label: "Email Insights",
            key: AppRoutes.admin.emails,
            icon: <MailOutlined />,
        },
    ];

    const handleNavClick = (e: { key: string }) => {
        navigate(e.key);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header Badge */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                <SafetyOutlined className="text-yellow-600 text-2xl" />
                <div className="flex flex-col">
                    <Text className="text-gray-900 text-sm font-bold uppercase tracking-wider">
                        Super Admin
                    </Text>
                    <Text className="text-gray-500 text-xs">Entix Platform Control</Text>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <Menu
                    mode="inline"
                    theme="light"
                    selectedKeys={[location.pathname]}
                    style={{ height: "100%", background: "transparent", borderRight: 0 }}
                    onClick={handleNavClick}
                    items={navItems}
                    defaultOpenKeys={["system-submenu"]}
                />
            </div>

            {/* Footer Profile */}
            <div
                className="p-4 mt-auto border-t"
                style={{ borderColor: token.colorBorderSecondary }}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar
                            size={32}
                            src={getAvatarUrl(user?.image, "sm")}
                            icon={<UserOutlined />}
                            className="flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <Text strong className="truncate text-xs text-gray-900">
                                {user?.name}
                            </Text>
                        </div>
                    </div>
                    <Dropdown
                        menu={{ items: userMenuItems, onClick: handleMenuClick }}
                        trigger={["click"]}
                        placement="topRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined className="text-gray-500" />}
                            className="flex-shrink-0"
                            style={{ backgroundColor: "transparent" }}
                        />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};
