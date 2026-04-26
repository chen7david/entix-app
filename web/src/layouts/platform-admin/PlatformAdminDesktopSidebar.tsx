import { DesktopDrawer } from "@web/src/components/navigation/Sidebar/DesktopDrawer";
import type React from "react";
import { APP_SIDEBAR_WIDTH_CSS_VAR } from "../shared/layout.constants";
import { PlatformAdminSidebarContent } from "./PlatformAdminSidebarContent";

export const PlatformAdminDesktopSidebar: React.FC = () => {
    return (
        <DesktopDrawer width={APP_SIDEBAR_WIDTH_CSS_VAR}>
            <PlatformAdminSidebarContent />
        </DesktopDrawer>
    );
};
