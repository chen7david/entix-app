import { Outlet } from "react-router";
import { Layout } from "antd";
import { AdminDesktopSidebar } from "@web/src/layouts/AdminDesktopSidebar";

const { Sider, Content } = Layout;

export const AdminLayout: React.FC = () => {
    return (
        <Layout className="min-h-screen">
            {/* Keeping it simple for Super Admins: Desktop-first view. 
                We can add a MobileAdminSidebar later if needed, but Super Admins 
                typically manage orgs from desktop screens. */}
            <Sider className="hidden md:block" width={240} theme="dark">
                <AdminDesktopSidebar />
            </Sider>
            <Layout hasSider>
                <Content
                    className="overflow-auto bg-gray-50"
                    style={{
                        backgroundColor: '#f8fafc' // Slightly different background to distinguish from tenant
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
