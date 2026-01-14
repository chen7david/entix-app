import { Outlet } from "react-router";
import { Layout, theme } from "antd";
import { MobileSidebar } from "@web/src/components/navigation/Sidebar/MobileSidebar";
import { DesktopSidebar } from "@web/src/components/navigation/Sidebar/DesktopSidebar";

const { Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
    const { token } = theme.useToken();

    return (
        <Layout className="min-h-screen">
            <MobileSidebar />
            <Sider className="hidden md:block" width={240} theme="light">
                <DesktopSidebar />
            </Sider>
            <Layout hasSider>
                <Content
                    className="overflow-auto"
                    style={{
                        backgroundColor: token.colorBgLayout
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
