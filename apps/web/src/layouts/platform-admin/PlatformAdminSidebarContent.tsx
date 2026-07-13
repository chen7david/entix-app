import {
    ApartmentOutlined,
    ArrowLeftOutlined,
    DashboardOutlined,
    DollarOutlined,
    HistoryOutlined,
    LogoutOutlined,
    MailOutlined,
    MoonOutlined,
    SafetyOutlined,
    SunOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { AppRoutes, getAvatarUrl } from "@shared";
import { useAuth, useSignOut } from "@web/src/features/auth";
import { useTheme } from "@web/src/hooks/useTheme";
import { Avatar, Dropdown, Menu, type MenuProps, Typography, theme } from "antd";
import type React from "react";
import { useLocation, useNavigate } from "react-router";

const { Text } = Typography;
const { useToken } = theme;

export const PlatformAdminSidebarContent: React.FC = () => {
    const { user } = useAuth();
    const { mutate: signOut } = useSignOut();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useToken();

    const handleMenuClick: MenuProps["onClick"] = async (e) => {
        if (e.key === "logout") {
            signOut(undefined, {
                onSuccess: () => navigate(AppRoutes.auth.signIn),
            });
            return;
        }
        if (e.key === "exit") {
            navigate("/", { replace: true });
            return;
        }
        if (e.key === "theme") {
            toggleTheme();
        }
    };

    const userMenuItems: MenuProps["items"] = [
        {
            key: "exit",
            label: "Exit admin portal",
            icon: <ArrowLeftOutlined />,
        },
        {
            key: "theme",
            label: isDark ? "Light mode" : "Dark mode",
            icon: isDark ? <SunOutlined /> : <MoonOutlined />,
        },
        { type: "divider" },
        {
            key: "logout",
            label: "Sign out",
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    const navItems: MenuProps["items"] = [
        {
            label: "System Dashboard",
            key: AppRoutes.admin.index,
            icon: <DashboardOutlined />,
        },
        {
            label: "Billing",
            key: AppRoutes.admin.billing,
            icon: <DollarOutlined />,
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
        {
            label: "Audit Logs",
            key: AppRoutes.admin.auditLogs,
            icon: <HistoryOutlined />,
        },
    ];

    const handleNavClick = (e: { key: string }) => {
        navigate(e.key);
    };

    return (
        <div className="flex flex-col h-full">
            <div
                className="px-3.5 pt-4 pb-3 flex items-center gap-3 shrink-0"
                style={{ borderBottom: `1px solid ${token.colorSplit}` }}
            >
                <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                        background: token.colorWarningBg,
                        color: token.colorWarning,
                    }}
                >
                    <SafetyOutlined style={{ fontSize: 16 }} />
                </div>
                <div className="flex flex-col min-w-0">
                    <Text
                        strong
                        className="font-display truncate"
                        style={{ fontSize: 13.5, letterSpacing: "-0.01em" }}
                    >
                        Platform
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11.5 }}>
                        Super admin
                    </Text>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 min-h-0">
                <Menu
                    mode="inline"
                    theme="light"
                    selectedKeys={[location.pathname]}
                    style={{ height: "100%", background: "transparent", borderRight: 0 }}
                    onClick={handleNavClick}
                    items={navItems}
                />
            </div>

            <div
                className="px-2.5 py-2 shrink-0"
                style={{ borderTop: `1px solid ${token.colorSplit}` }}
            >
                <Dropdown
                    menu={{ items: userMenuItems, onClick: handleMenuClick }}
                    trigger={["click"]}
                    placement="topLeft"
                >
                    <button
                        type="button"
                        aria-label="Account menu"
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-left transition-colors"
                        style={{ background: "transparent", border: "none" }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = token.colorFillTertiary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <Avatar
                            size={34}
                            src={getAvatarUrl(user?.image, "sm") || undefined}
                            icon={<UserOutlined />}
                            className="shrink-0"
                            style={{ backgroundColor: token.colorPrimary }}
                        />
                        <div className="min-w-0 flex-1">
                            <Text
                                strong
                                ellipsis
                                style={{ fontSize: 13, lineHeight: "17px", display: "block" }}
                            >
                                {user?.name || "Account"}
                            </Text>
                            <Text
                                type="secondary"
                                ellipsis
                                style={{ fontSize: 11, lineHeight: "14px", display: "block" }}
                            >
                                {user?.email || "Platform control"}
                            </Text>
                        </div>
                    </button>
                </Dropdown>
            </div>
        </div>
    );
};
