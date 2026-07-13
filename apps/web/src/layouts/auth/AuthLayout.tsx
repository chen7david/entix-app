import { ThemeToggle } from "@web/src/components/common/ThemeToggle";
import { RouteErrorBoundary } from "@web/src/components/error/RouteErrorBoundary";
import { Typography, theme } from "antd";
import { Outlet } from "react-router";

const { Title, Text } = Typography;

export const AuthLayout = () => {
    const { token } = theme.useToken();

    return (
        <div
            className="min-h-[100dvh] w-full flex items-center justify-center overflow-y-auto p-4 transition-colors duration-200 relative"
            style={{
                background: `radial-gradient(1200px 600px at 10% -10%, ${token.colorPrimaryBg} 0%, transparent 55%), radial-gradient(900px 500px at 100% 0%, ${token.colorInfoBg} 0%, transparent 50%), ${token.colorBgLayout || "var(--bg-base)"}`,
            }}
        >
            <div className="fixed top-6 left-6 z-50 flex items-center gap-2">
                <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: token.colorPrimary }}
                >
                    E
                </div>
                <Title level={4} className="!mb-0 !text-base font-display tracking-tight">
                    Entix
                </Title>
            </div>
            <div className="fixed top-6 right-6 z-50">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-[420px]">
                <RouteErrorBoundary>
                    <Outlet />
                </RouteErrorBoundary>
                <Text type="secondary" className="block text-center mt-6 text-xs tracking-wide">
                    Academy operations · Lessons · Billing
                </Text>
            </div>
        </div>
    );
};
