import { Outlet } from "react-router";
import { theme } from "antd";

export const AuthLayout = () => {
    const { token } = theme.useToken();

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center overflow-hidden p-4"
            style={{ backgroundColor: token.colorBgLayout }}
        >
            <Outlet />
        </div>
    );
};