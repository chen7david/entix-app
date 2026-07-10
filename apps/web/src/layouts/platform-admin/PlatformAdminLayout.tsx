import { RouteErrorBoundary } from "@web/src/components/error/RouteErrorBoundary";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Layout, theme } from "antd";
import { Outlet } from "react-router";
import { DesktopSidebar } from "../shared/DesktopSidebar";
import { APP_SIDEBAR_WIDTH_CSS_VAR } from "../shared/layout.constants";
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
                width={APP_SIDEBAR_WIDTH_CSS_VAR}
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
                                <Outlet />
                            </RouteErrorBoundary>
                        </div>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};
