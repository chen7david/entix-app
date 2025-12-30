import { Outlet } from "react-router";

export const AuthLayout = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 overflow-hidden">
            <Outlet />
        </div>
    );
};