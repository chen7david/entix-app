// DesktopSidebar.tsx

import type { DrawerProps } from "antd";
import { theme } from "antd";
import classNames from "classnames";
import type React from "react";

type DesktopDrawerProps = Omit<
    DrawerProps,
    | "open"
    | "onClose"
    | "mask"
    | "maskClosable"
    | "rootStyle"
    | "getContainer"
    | "push"
    | "closable"
    | "closeIcon"
>;

export const DesktopDrawer: React.FC<DesktopDrawerProps> = ({
    title,
    extra,
    footer,
    width = 240,
    children,
    style,
    className,
    ...rest
}) => {
    const { token } = theme.useToken();

    return (
        <div
            className={classNames("flex flex-col h-full", className)}
            style={{
                width,
                backgroundColor: token.colorBgContainer,
                borderRight: `1px solid ${token.colorSplit}`,
                ...style,
            }}
            {...rest}
        >
            {(title || extra) && (
                <div
                    className="flex items-center justify-between px-4 py-3 min-h-[56px]"
                    style={{ borderBottom: `1px solid ${token.colorSplit}` }}
                >
                    {title && (
                        <div className="text-base font-semibold" style={{ color: token.colorText }}>
                            {title}
                        </div>
                    )}
                    {extra && <div className="flex items-center gap-2">{extra}</div>}
                </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>

            {footer && (
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${token.colorSplit}` }}>
                    {footer}
                </div>
            )}
        </div>
    );
};
