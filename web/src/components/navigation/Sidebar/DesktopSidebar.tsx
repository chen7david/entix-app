import { Avatar, Button } from "antd";
import { SidebarMenu } from "./SidebarMenu";
import { useAuth } from "@web/src/hooks/auth/auth.hook";
import { useNavigate } from "react-router";
import { links } from "@web/src/constants/links";
import { DesktopDrawer } from "./DesktopDrawer";

export const DesktopSidebar: React.FC = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        signOut();
        navigate(links.auth.signIn);
    };

    return (
        <DesktopDrawer
            title={<h1>Entix</h1>}
            size={240}
            footer={(
                <div className="flex items-center justify-between">
                    <Avatar />
                    <Button type="text" onClick={handleLogout} >Logout</Button>
                </div>
            )}
        >
            <SidebarMenu />
        </DesktopDrawer>
    );
};