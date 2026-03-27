import React from 'react';
import { Menu, type MenuProps } from "antd";
import { 
    DashboardOutlined, 
    BookOutlined, 
    ShoppingOutlined, 
    WalletOutlined, 
    YoutubeOutlined, 
    TruckOutlined, 
    BankOutlined, 
    TeamOutlined, 
    UserAddOutlined, 
    CloudUploadOutlined, 
    PlaySquareOutlined, 
    OrderedListOutlined, 
    CalendarOutlined, 
    AreaChartOutlined 
} from "@ant-design/icons";
import { useLocation } from "react-router";
import { useOrgNavigate } from '@web/src/hooks/navigation/useOrgNavigate';
import { AppRoutes } from "@shared/constants/routes";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";

export const SidebarMenu: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const location = useLocation();
    const { close } = useSidebar();

    const { activeOrganization } = useOrganization();
    const slug = activeOrganization?.slug || '';

    // Strip the org slug prefix from the current pathname to find the matching menu key naturally
    const orgPrefix = slug ? `/org/${slug}` : '';
    let activeKey = location.pathname;
    if (orgPrefix && activeKey.startsWith(orgPrefix)) {
        activeKey = activeKey.replace(orgPrefix, '') || '/';
    }

    const menuItems: MenuProps['items'] = [
        {
            label: 'Dashboard',
            key: AppRoutes.org.dashboard.index,
            icon: <DashboardOutlined />,
            disabled: !slug,
        },
        {
            label: 'Lessons',
            key: AppRoutes.org.dashboard.lessons,
            icon: <BookOutlined />,
            disabled: !slug,
        },
        {
            label: 'Shop',
            key: AppRoutes.org.dashboard.shop,
            icon: <ShoppingOutlined />,
            disabled: !slug,
        },
        {
            label: 'Wallet',
            key: AppRoutes.org.dashboard.wallet,
            icon: <WalletOutlined />,
            disabled: !slug,
        },
        {
            label: 'Movies',
            key: AppRoutes.org.dashboard.movies,
            icon: <YoutubeOutlined />,
            disabled: !slug,
        },
        {
            label: 'Orders',
            key: AppRoutes.org.dashboard.orders,
            icon: <TruckOutlined />,
            disabled: !slug,
        },
        {
            type: 'divider',
        },
        {
            label: 'Organizations',
            key: AppRoutes.org.manage.index,
            icon: <BankOutlined />,
            disabled: !slug,
        },
        ...(activeOrganization ? [
            {
                label: 'Media',
                key: 'media_collection', // using group wrapper
                icon: <PlaySquareOutlined />,
                children: [
                    {
                        label: 'Media Library',
                        key: AppRoutes.org.manage.media,
                        icon: <PlaySquareOutlined />,
                    },
                    {
                        label: 'Playlists',
                        key: AppRoutes.org.manage.playlists,
                        icon: <OrderedListOutlined />,
                    },
                ]
            },
            {
                label: 'Analytics',
                key: '/analytics',
                icon: <AreaChartOutlined />,
            },
            {
                label: 'Schedule',
                key: '/schedule',
                icon: <CalendarOutlined />,
            },
            {
                label: 'Members',
                key: AppRoutes.org.manage.members,
                icon: <TeamOutlined />,
            },
            {
                label: 'Invitations',
                key: AppRoutes.org.manage.invitations,
                icon: <UserAddOutlined />,
            },
            {
                label: 'Files & Uploads',
                key: '/uploads',
                icon: <CloudUploadOutlined />,
            }
        ] : [])
    ];

    const handleMenuClick = (e: { key: string }) => {
        // Disregard non-routable group keys
        if (e.key === 'media_collection') return;
        
        navigateOrg(e.key);
        close();
    };

    return (
        <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            style={{ height: "100%", borderRight: 0 }}
            onClick={handleMenuClick}
            items={menuItems}
        />
    );
};