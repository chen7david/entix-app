import { DesktopDrawer } from "@web/src/components/navigation/Sidebar/DesktopDrawer";

interface DesktopSidebarProps {
    children?: React.ReactNode;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ children }) => {
    return <DesktopDrawer size={240}>{children}</DesktopDrawer>;
};
