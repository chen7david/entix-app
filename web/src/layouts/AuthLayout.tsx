import { Outlet, Navigate } from "react-router";
import { theme, Spin } from "antd";
import { useSession } from "../lib/auth-client";
import { links } from "../constants/links";

export const AuthLayout = () => {
    const { token } = theme.useToken();
    const { data: session, isPending } = useSession();

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (session) {
        return <Navigate to={links.dashboard.index} replace />;
    }

    return (
        <div
            className="min-h-[100dvh] w-full flex items-center justify-center overflow-y-auto p-4"
            style={{ backgroundColor: token.colorBgLayout }}
        >
            <Outlet />
        </div>
    );
};