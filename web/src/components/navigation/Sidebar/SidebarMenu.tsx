import React from 'react';
import { Menu, type MenuProps } from "antd";
import { HomeOutlined, BookOutlined, ShoppingOutlined, WalletOutlined, YoutubeOutlined, TruckOutlined, TeamOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";
import { links } from "@web/src/constants/links";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useAuth } from "@web/src/hooks/auth/useAuth";

export const SidebarMenu: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { close } = useSidebar();
    const { session } = useAuth();

    const { getOrgLink, activeOrganization } = useOrganization();
    const slug = activeOrganization?.slug || '';

    const isAdmin = session.data?.user?.role === 'admin';

    const menuItems: MenuProps['items'] = [
        {
            label: 'Home',
            key: slug ? links.dashboard.index(slug) : 'home-disabled',
            icon: <HomeOutlined />,
            disabled: !slug,
        },
        {
            label: 'Lessons',
            key: slug ? links.dashboard.lessons(slug) : 'lessons-disabled',
            icon: <BookOutlined />,
            disabled: !slug,
        },
        {
            label: 'Shop',
            key: slug ? links.dashboard.shop(slug) : 'shop-disabled',
            icon: <ShoppingOutlined />,
            disabled: !slug,
        },
        {
            label: 'Wallet',
            key: slug ? links.dashboard.wallet(slug) : 'wallet-disabled',
            icon: <WalletOutlined />,
            disabled: !slug,
        },
        {
            label: 'Movies',
            key: slug ? links.dashboard.movies(slug) : 'movies-disabled',
            icon: <YoutubeOutlined />,
            disabled: !slug,
        },
        {
            label: 'Orders',
            key: slug ? links.dashboard.orders(slug) : 'orders-disabled',
            icon: <TruckOutlined />,
            disabled: !slug,
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
                    key: slug ? links.organization.index(slug) : 'orgs-disabled',
                    disabled: !slug,
                },
                ...(activeOrganization ? [
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