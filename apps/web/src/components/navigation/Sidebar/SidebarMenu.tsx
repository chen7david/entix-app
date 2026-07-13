import { DashboardOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrganization, useOrgNavigate, useOrgRole } from "@web/src/features/organization";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { buildOrgSidebarGroups } from "@web/src/navigation/org-nav";
import { Menu, type MenuProps } from "antd";
import type React from "react";
import { useMemo } from "react";
import { useLocation } from "react-router";

export const SidebarMenu: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const location = useLocation();
    const { close } = useSidebar();
    const { isAdminOrOwner, isFinance, isFinanceStaff, isStaff, isStudent, isTeacher } =
        useOrgRole();
    const { activeOrganization } = useOrganization();
    const slug = activeOrganization?.slug || "";

    const orgPrefix = slug ? `/org/${slug}` : "";
    let activeKey = location.pathname;
    if (orgPrefix && activeKey.startsWith(orgPrefix)) {
        activeKey = activeKey.replace(orgPrefix, "") || "/";
    }

    const handleMenuClick = (e: { key: string }) => {
        navigateOrg(e.key);
        close();
    };

    const menuItems: MenuProps["items"] = useMemo(() => {
        const groups = buildOrgSidebarGroups({
            isStudent,
            isTeacher,
            isAdminOrOwner,
            isFinance,
            isFinanceStaff,
            isStaff,
        });

        return [
            {
                label: "Home",
                key: AppRoutes.org.dashboard.index,
                icon: <DashboardOutlined />,
                disabled: !slug,
            },
            ...groups.map((group) => ({
                type: "group" as const,
                label: group.label,
                children: group.children.map((item) => ({
                    ...item,
                    disabled: !slug,
                })),
            })),
        ];
    }, [isAdminOrOwner, isFinance, isFinanceStaff, isStaff, isStudent, isTeacher, slug]);

    return (
        <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            style={{ height: "100%", borderRight: 0 }}
            onClick={handleMenuClick}
            items={menuItems}
        />
    );
};
