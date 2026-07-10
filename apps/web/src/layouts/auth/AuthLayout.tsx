import { ThemeToggle } from "@web/src/components/common/ThemeToggle";
import { RouteErrorBoundary } from "@web/src/components/error/RouteErrorBoundary";
import { theme } from "antd";
import { Outlet } from "react-router";

export const AuthLayout = () => {
    const { token } = theme.useToken();

    return (
        <div
            className="min-h-[100dvh] w-full flex items-center justify-center overflow-y-auto p-4 transition-colors duration-200"
            style={{ backgroundColor: token.colorBgLayout || "var(--bg-base)" }}
        >
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            <RouteErrorBoundary>
                <Outlet />
            </RouteErrorBoundary>
        </div>
    );
};
