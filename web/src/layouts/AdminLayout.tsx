import { Outlet } from "react-router";
import { Layout, theme } from "antd";
import { AdminDesktopSidebar } from "./AdminDesktopSidebar";
// import { AdminMobileSidebar } from "./AdminMobileSidebar"; // Optional later depending on needs

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
