import { Outlet } from "react-router";
import { Layout } from "antd";
import { MobileSidebar } from "@web/src/components/navigation/Sidebar/MobileSidebar";
import { DesktopSidebar } from "@web/src/components/navigation/Sidebar/DesktopSidebar";

const { Sider, Content } = Layout;

export const DashboardLayout: React.FC = () => {
    return (
        <Layout className="min-h-screen">
            <Sider className="hidden md:block" width={240} theme="light">
                <MobileSidebar />
                <DesktopSidebar />
            </Sider>
            <Layout hasSider >
                <Content className="overflow-auto bg-gray-50">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
