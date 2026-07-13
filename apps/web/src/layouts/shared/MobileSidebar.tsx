import { CloseOutlined } from "@ant-design/icons";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { Button, Drawer, theme } from "antd";
import { APP_SIDEBAR_WIDTH_CSS_VAR } from "./layout.constants";

interface MobileSidebarProps {
    children?: React.ReactNode;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ children }) => {
    const { isOpen, close } = useSidebar();
    const { token } = theme.useToken();

    return (
        <Drawer
            open={isOpen}
            onClose={close}
            placement="left"
            closable={false}
            width={APP_SIDEBAR_WIDTH_CSS_VAR}
            styles={{
                body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" },
            }}
        >
            <div
                className="flex items-center justify-end px-2 h-12 shrink-0"
                style={{ borderBottom: `1px solid ${token.colorSplit}` }}
            >
                <Button
                    icon={<CloseOutlined />}
                    type="text"
                    onClick={close}
                    aria-label="Close menu"
                />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
        </Drawer>
    );
};
