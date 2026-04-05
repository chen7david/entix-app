import { DesktopDrawer } from "./DesktopDrawer";
import { SidebarContent } from "./SidebarContent";

interface DesktopSidebarProps {
    variant?: "org" | "admin";
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ variant = "org" }) => {
    return (
        <DesktopDrawer size={240}>
            <SidebarContent variant={variant} />
        </DesktopDrawer>
    );
};
