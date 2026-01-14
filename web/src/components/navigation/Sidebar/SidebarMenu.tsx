import { Menu } from "antd";
import { HomeOutlined, UserOutlined, BookOutlined, ShoppingOutlined, WalletOutlined, YoutubeOutlined, TruckOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router";
import { links } from "@web/src/constants/links";
import { useSidebar } from "@web/src/hooks/navigation/sidebar.hook";

export const SidebarMenu: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { close } = useSidebar();

    const menuItems = [
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