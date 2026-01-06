// DesktopSidebar.tsx
import React from "react";
import type { DrawerProps } from "antd";
import classNames from "classnames";

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
    return (
        <div
            className={classNames(
                "flex flex-col h-full bg-white border-r border-gray-200",
                className
            )}
            style={{ width, ...style }}
            {...rest}
        >
            {(title || extra) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 min-h-[56px]">
                    {title && <div className="text-base font-semibold text-gray-800">{title}</div>}
                    {extra && <div className="flex items-center gap-2">{extra}</div>}
                </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                {children}
            </div>

            {footer && (
                <div className="px-6 py-4 border-t border-gray-100">
                    {footer}
                </div>
            )}
        </div>
    );
};
