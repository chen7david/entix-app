import { DesktopDrawer } from "@web/src/components/navigation/Sidebar/DesktopDrawer";
import type React from "react";
import { PlatformAdminSidebarContent } from "./PlatformAdminSidebarContent";

export const PlatformAdminDesktopSidebar: React.FC = () => {
    return (
        <DesktopDrawer size={240}>
            <PlatformAdminSidebarContent />
        </DesktopDrawer>
    );
};
