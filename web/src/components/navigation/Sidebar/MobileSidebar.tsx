import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { Button, Drawer } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { SidebarContent } from "./SidebarContent";

export const MobileSidebar: React.FC = () => {
    const { isOpen, close } = useSidebar();

    return (
        <Drawer
            open={isOpen}
            onClose={close}
            placement="left"
            closable={false}
            size={240}
            styles={{ body: { padding: 0 } }}
            extra={
                <div className="absolute top-2 right-2 z-50 md:hidden">
                    <Button icon={<CloseOutlined />} type="text" onClick={close} />
                </div>
            }
        >
            <SidebarContent />
        </Drawer>
    );
};