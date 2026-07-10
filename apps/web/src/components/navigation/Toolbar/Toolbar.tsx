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
            className={cn("z-10 flex items-center sticky top-0 h-16 md:hidden px-8", className)}
            style={{
                backgroundColor: `${token.colorBgContainer}CC`, // 80% opacity for glass effect
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
            }}
            {...rest}
        >
            <div className="flex items-center w-full gap-2">
                <div className="md:hidden">
                    <div>
                        <Button onClick={toggle} size="large" icon={<MenuOutlined />} type="text" />
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
};
