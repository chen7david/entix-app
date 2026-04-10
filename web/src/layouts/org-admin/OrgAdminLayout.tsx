import { ImpersonationBanner } from "@web/src/components/navigation/ImpersonationBanner/ImpersonationBanner";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { GlobalUploadManager } from "@web/src/features/media";
import { Layout, theme } from "antd";
import { Outlet } from "react-router";
import { DesktopSidebar } from "../shared/DesktopSidebar";
import { MobileSidebar } from "../shared/MobileSidebar";
import { OrgAdminSidebarContent } from "./OrgAdminSidebarContent";

const { Sider, Content } = Layout;

export const OrgAdminLayout: React.FC = () => {
    const { token } = theme.useToken();

    return (
        <Layout style={{ height: "100dvh", overflow: "hidden" }}>
            <MobileSidebar>
                <OrgAdminSidebarContent />
            </MobileSidebar>
            <Sider
                className="hidden md:block"
                width={240}
                style={{ height: "100%", overflow: "hidden" }}
            >
                <DesktopSidebar>
                    <OrgAdminSidebarContent />
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
                            <ImpersonationBanner />
                            <Outlet />
                        </div>
                    </div>
                </Content>
            </Layout>
            <GlobalUploadManager />
        </Layout>
    );
};
