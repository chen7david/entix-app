import { MenuOutlined } from "@ant-design/icons";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { Button, theme } from "antd";
import cn from "classnames";

const { useToken } = theme;

export const Toolbar = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => {
    const { toggle } = useSidebar();
    const { token } = useToken();

    return (
        <div
            className={cn("z-10 flex items-center sticky top-0 h-14 md:hidden px-4", className)}
            style={{
                backgroundColor: `${token.colorBgContainer}CC`,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
            }}
            {...rest}
        >
            <div className="flex items-center w-full gap-2">
                <Button onClick={toggle} size="large" icon={<MenuOutlined />} type="text" />
                {children}
            </div>
        </div>
    );
};
