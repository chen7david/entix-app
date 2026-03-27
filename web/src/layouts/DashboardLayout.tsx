import { ImpersonationBanner } from "@web/src/components/navigation/ImpersonationBanner/ImpersonationBanner";
import { DesktopSidebar } from "@web/src/components/navigation/Sidebar/DesktopSidebar";
import { MobileSidebar } from "@web/src/components/navigation/Sidebar/MobileSidebar";
import { GlobalUploadManager } from "@web/src/components/Upload/GlobalUploadManager";
import { Layout, theme } from "antd";
import { Outlet } from "react-router";

const { Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
    const { token } = theme.useToken();

    return (
        <Layout className="min-h-screen">
            <MobileSidebar />
            <Sider className="hidden md:block" width={240}>
                <DesktopSidebar />
            </Sider>
            <Layout hasSider>
                <Content
                    className="overflow-auto relative"
                    style={{
                        backgroundColor: token.colorBgLayout,
                    }}
                >
                    <ImpersonationBanner />
                    <Outlet />
                </Content>
            </Layout>
            <GlobalUploadManager />
        </Layout>
    );
};
