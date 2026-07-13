import { theme } from "antd";
import type React from "react";
import { SidebarMenu } from "../../components/navigation/Sidebar/SidebarMenu";
import { SidebarOrgSwitcher } from "../../components/navigation/Sidebar/SidebarOrgSwitcher";
import { SidebarUserMenu } from "../../components/navigation/Sidebar/SidebarUserMenu";

/**
 * Org sidebar shell (Option C):
 * - Top: workspace context (org + role)
 * - Middle: role-scoped destinations
 * - Bottom: signed-in person
 */
export const OrgAdminSidebarContent: React.FC = () => {
    const { token } = theme.useToken();

    return (
        <div className="flex flex-col h-full">
            <div
                className="px-2.5 pt-3 pb-2 shrink-0"
                style={{ borderBottom: `1px solid ${token.colorSplit}` }}
            >
                <SidebarOrgSwitcher />
            </div>

            <div className="flex-1 overflow-y-auto py-2 min-h-0">
                <SidebarMenu />
            </div>

            <div
                className="px-2.5 py-2 shrink-0"
                style={{ borderTop: `1px solid ${token.colorSplit}` }}
            >
                <SidebarUserMenu />
            </div>
        </div>
    );
};
