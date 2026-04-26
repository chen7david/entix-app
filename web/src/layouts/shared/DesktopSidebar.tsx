import { DesktopDrawer } from "@web/src/components/navigation/Sidebar/DesktopDrawer";
import { APP_SIDEBAR_WIDTH_CSS_VAR } from "./layout.constants";

interface DesktopSidebarProps {
    children?: React.ReactNode;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ children }) => {
    return <DesktopDrawer width={APP_SIDEBAR_WIDTH_CSS_VAR}>{children}</DesktopDrawer>;
};
