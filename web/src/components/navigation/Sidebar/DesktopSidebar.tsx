import { DesktopDrawer } from "./DesktopDrawer";
import { SidebarContent } from "./SidebarContent";

export const DesktopSidebar: React.FC = () => {
    return (
        <DesktopDrawer size={240}>
            <SidebarContent />
        </DesktopDrawer>
    );
};