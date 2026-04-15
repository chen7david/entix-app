import {
    ApartmentOutlined,
    ArrowLeftOutlined,
    DashboardOutlined,
    DollarOutlined,
    MailOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { Menu, type MenuProps } from "antd";
import type React from "react";
import { useLocation, useNavigate } from "react-router";

export const AdminSidebarMenu: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { close } = useSidebar();

    const menuItems: MenuProps["items"] = [
        {
            label: "Back to Dashboard",
            key: "back_to_org",
            icon: <ArrowLeftOutlined />,
            danger: true,
        },
        {
            type: "divider",
        },
        {
            label: "Admin Overview",
            key: AppRoutes.admin.index,
            icon: <DashboardOutlined />,
        },
        {
            label: "Manage Users",
            key: AppRoutes.admin.users,
            icon: <TeamOutlined />,
        },
        {
            label: "Manage Organizations",
            key: AppRoutes.admin.organizations,
            icon: <ApartmentOutlined />,
        },
        {
            label: "Email Insights",
            key: AppRoutes.admin.emails,
            icon: <MailOutlined />,
        },
        {
            label: "Billing Management",
            key: AppRoutes.admin.billing,
            icon: <DollarOutlined />,
        },
    ];

    const handleMenuClick = (e: { key: string }) => {
        if (e.key === "back_to_org") {
            navigate("/"); // HomeRedirect logic will handle jumping into the last active org safely
            close();
            return;
        }
        navigate(e.key);
        close();
    };

    return (
        <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: "100%", borderRight: 0 }}
            onClick={handleMenuClick}
            items={menuItems}
        />
    );
};
