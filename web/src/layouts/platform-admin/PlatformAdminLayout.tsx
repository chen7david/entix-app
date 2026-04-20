import { RouteErrorBoundary } from "@web/src/components/error/RouteErrorBoundary";
import { ImpersonationBanner } from "@web/src/components/navigation/ImpersonationBanner/ImpersonationBanner";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Layout, theme } from "antd";
import { Outlet } from "react-router";
import { DesktopSidebar } from "../shared/DesktopSidebar";
import { MobileSidebar } from "../shared/MobileSidebar";
import { PlatformAdminSidebarContent } from "./PlatformAdminSidebarContent";

const { Sider, Content } = Layout;

export const PlatformAdminLayout: React.FC = () => {
    const { token } = theme.useToken();

    return (
        <Layout style={{ height: "100dvh", overflow: "hidden" }}>
            <MobileSidebar>
                <PlatformAdminSidebarContent />
            </MobileSidebar>
            <Sider
                className="hidden md:block"
                width={240}
                style={{ height: "100%", overflow: "hidden" }}
            >
                <DesktopSidebar>
                    <PlatformAdminSidebarContent />
                </DesktopSidebar>
            </Sider>
            <Layout hasSider style={{ flex: 1, overflow: "hidden" }}>
                <Content
                    className="flex flex-col relative"
                    style={{
                        height: "100%",
                        overflowY: "auto",
                        backgroundColor: token.colorBgLayout,
                    }}
                >
                    <Toolbar />
                    <div className="flex-1 flex flex-col min-h-0 p-8">
                        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0">
                            <RouteErrorBoundary>
                                <ImpersonationBanner />
                                <Outlet />
                            </RouteErrorBoundary>
                        </div>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};
