import { useSidebar } from "@web/src/hooks/navigation/sidebar.hook";
import { Avatar, Button, Drawer } from "antd";
import { SidebarMenu } from "./SidebarMenu";
import { CloseOutlined } from "@ant-design/icons";
import { useAuth } from "@web/src/hooks/auth/auth.hook";
import { useNavigate } from "react-router";
import { links } from "@web/src/constants/links";

export const MobileSidebar: React.FC = () => {
    const { isOpen, close } = useSidebar();
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        signOut();
        close();
        navigate(links.auth.signIn);
    };

    return (
        <Drawer
            title={<h1>Entix</h1>}
            open={isOpen}
            onClose={close}
            placement="left"
            closable={false}
            size={240}
            extra={
                <Button icon={<CloseOutlined />} type="text" onClick={close} />
            }
            footer={(
                <div className="flex items-center justify-between">
                    <Avatar />
                    <Button type="text" onClick={handleLogout} >Logout</Button>
                </div>
            )}
        >
            <SidebarMenu />
        </Drawer>
    );
};