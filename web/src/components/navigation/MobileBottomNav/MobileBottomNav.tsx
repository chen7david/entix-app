import {
    BookOutlined,
    DashboardOutlined,
    SettingOutlined,
    ShoppingOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrganization, useOrgNavigate, useOrgRole } from "@web/src/features/organization";
import { theme } from "antd";
import type React from "react";
import { useLocation } from "react-router";

interface BottomTab {
    key: string;
    label: string;
    icon: React.ReactNode;
}

export const MobileBottomNav: React.FC = () => {
    const { token } = theme.useToken();
    const navigateOrg = useOrgNavigate();
    const location = useLocation();
    const { isAdminOrOwner, isStaff } = useOrgRole();
    const { activeOrganization } = useOrganization();
    const slug = activeOrganization?.slug || "";

    const studentTabs: BottomTab[] = [
        { key: AppRoutes.org.dashboard.index, label: "Home", icon: <DashboardOutlined /> },
        { key: AppRoutes.org.dashboard.lessons, label: "Lessons", icon: <BookOutlined /> },
        { key: AppRoutes.org.dashboard.shop, label: "Shop", icon: <ShoppingOutlined /> },
        { key: AppRoutes.org.dashboard.settings, label: "Settings", icon: <SettingOutlined /> },
    ];

    const teacherTabs: BottomTab[] = [
        { key: AppRoutes.org.dashboard.index, label: "Home", icon: <DashboardOutlined /> },
        { key: AppRoutes.org.teaching.sessions, label: "Sessions", icon: <BookOutlined /> },
        { key: AppRoutes.org.teaching.students, label: "Students", icon: <TeamOutlined /> },
        { key: AppRoutes.org.dashboard.settings, label: "Settings", icon: <SettingOutlined /> },
    ];

    const adminTabs: BottomTab[] = [
        { key: AppRoutes.org.dashboard.index, label: "Home", icon: <DashboardOutlined /> },
        { key: AppRoutes.org.admin.members, label: "Members", icon: <TeamOutlined /> },
        { key: AppRoutes.org.admin.analytics, label: "Analytics", icon: <BookOutlined /> },
        { key: AppRoutes.org.dashboard.settings, label: "Settings", icon: <SettingOutlined /> },
    ];

    const tabs = isAdminOrOwner ? adminTabs : isStaff ? teacherTabs : studentTabs;

    const orgPrefix = slug ? `/org/${slug}` : "";
    let pathSuffix = location.pathname;
    if (orgPrefix && pathSuffix.startsWith(orgPrefix)) {
        pathSuffix = pathSuffix.slice(orgPrefix.length) || "/";
    }
    const tabsBySpecificity = [...tabs].sort((a, b) => b.key.length - a.key.length);
    const activeTab =
        tabsBySpecificity.find((t) => pathSuffix === t.key)?.key ??
        tabsBySpecificity.find((t) => pathSuffix.startsWith(`${t.key}/`))?.key ??
        tabs[0].key;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[800] md:hidden flex items-center justify-around border-t"
            style={{
                backgroundColor: token.colorBgContainer,
                borderColor: token.colorBorderSecondary,
                paddingBottom: "env(safe-area-inset-bottom)",
                height: 56,
            }}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => navigateOrg(tab.key)}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
                        style={{
                            color: isActive ? token.colorPrimary : token.colorTextSecondary,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        <span style={{ fontSize: 20 }}>{tab.icon}</span>
                        <span style={{ fontSize: 10, lineHeight: 1.2 }}>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
