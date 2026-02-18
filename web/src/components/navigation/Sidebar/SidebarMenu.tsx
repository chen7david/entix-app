import { Menu, type MenuProps } from "antd";
import { HomeOutlined, BookOutlined, ShoppingOutlined, WalletOutlined, YoutubeOutlined, TruckOutlined, TeamOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";
import { links } from "@web/src/constants/links";
import { useSidebar } from "@web/src/hooks/navigation/sidebar.hook";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useAuth } from "@web/src/hooks/auth/auth.hook";

export const SidebarMenu: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { close } = useSidebar();
    const { session } = useAuth();

    const { getOrgLink, activeOrganization } = useOrganization();

    const isAdmin = session.data?.user?.role === 'admin';

    const menuItems: MenuProps['items'] = [
        {
            label: 'Home',
            key: links.dashboard.index,
            icon: <HomeOutlined />,
        },
        {
            label: 'Lessons',
            key: links.dashboard.lessons,
            icon: <BookOutlined />,
        },
        {
            label: 'Shop',
            key: links.dashboard.shop,
            icon: <ShoppingOutlined />,
        },
        {
            label: 'Wallet',
            key: links.dashboard.wallet,
            icon: <WalletOutlined />,
        },
        {
            label: 'Movies',
            key: links.dashboard.movies,
            icon: <YoutubeOutlined />,
        },
        {
            label: 'Orders',
            key: links.dashboard.orders,
            icon: <TruckOutlined />,
        },
        {
            type: 'divider',
        },
        {
            label: 'Organization',
            key: 'organizations-submenu',
            icon: <TeamOutlined />,
            children: [
                {
                    label: 'Organizations',
                    key: links.organization.index,
                },
                ...(activeOrganization ? [
                    {
                        label: 'Dashboard',
                        key: getOrgLink(''),
                    },
                    {
                        label: 'Members',
                        key: getOrgLink('/members'),
                    },
                    {
                        label: 'Invitations',
                        key: getOrgLink('/invitations'),
                    }
                ] : [])
            ]
        },
        ...(isAdmin ? [
            {
                type: 'divider' as const,
            },
            {
                label: 'Admin',
                key: 'admin-submenu',
                icon: <CrownOutlined />,
                children: [
                    {
                        label: 'Dashboard',
                        key: links.admin.index,
                    },
                ],
            },
        ] : []),
    ];

    const handleMenuClick = (e: { key: string }) => {
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