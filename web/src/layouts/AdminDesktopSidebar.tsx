import { DesktopDrawer } from "@web/src/components/navigation/Sidebar/DesktopDrawer";
import type React from "react";
import { AdminSidebarContent } from "./AdminSidebarContent";

export const AdminDesktopSidebar: React.FC = () => {
    return (
        <DesktopDrawer size={240}>
            <AdminSidebarContent />
        </DesktopDrawer>
    );
};
