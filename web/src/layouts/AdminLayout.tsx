import { ImpersonationBanner } from "@web/src/components/navigation/ImpersonationBanner/ImpersonationBanner";
import { Layout, theme } from "antd";
import { Outlet } from "react-router";
import { AdminDesktopSidebar } from "./AdminDesktopSidebar";

const { Sider, Content } = Layout;

export const AdminLayout: React.FC = () => {
    const { token } = theme.useToken();

    return (
        <Layout className="min-h-screen">
            {/* <AdminMobileSidebar /> */}
            <Sider className="hidden md:block" width={240} theme="light">
                <AdminDesktopSidebar />
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
        </Layout>
    );
};
