import { Outlet } from "react-router";
import { theme } from "antd";

export const AuthLayout = () => {
    const { token } = theme.useToken();

    return (
        <div
            className="min-h-[100dvh] w-full flex items-center justify-center overflow-y-auto p-4"
            style={{ backgroundColor: token.colorBgLayout }}
        >
            <Outlet />
        </div>
    );
};