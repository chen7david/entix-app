import { Menu } from "antd";
import { HomeOutlined, UserOutlined, BookOutlined, ShoppingOutlined, WalletOutlined, YoutubeOutlined, TruckOutlined } from "@ant-design/icons";

export const SidebarMenu: React.FC = () => {
    return (
        <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            style={{ height: "100%", borderRight: 0 }}
            items={[
                {
                    label: 'Home',
                    key: '/',
                    icon: <HomeOutlined />,
                },
                {
                    label: 'Profile',
                    key: '/profile',
                    icon: <UserOutlined />,
                },
                {
                    label: 'Lessons',
                    key: '/lessons',
                    icon: <BookOutlined />,
                },
                {
                    label: 'Shop',
                    key: '/shop',
                    icon: <ShoppingOutlined />,
                },
                {
                    label: 'Wallet',
                    key: '/wallet',
                    icon: <WalletOutlined />,
                },
                {
                    label: 'Movies',
                    key: '/movies',
                    icon: <YoutubeOutlined />,
                },

                {
                    label: 'Orders',
                    key: '/orders',
                    icon: <TruckOutlined />,
                },
            ]}
        />
    );
};