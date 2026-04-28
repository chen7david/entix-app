import {
    AreaChartOutlined,
    BankOutlined,
    BookOutlined,
    CalendarOutlined,
    CloudUploadOutlined,
    DashboardOutlined,
    DollarOutlined,
    OrderedListOutlined,
    PictureOutlined,
    PlaySquareOutlined,
    SettingOutlined,
    ShoppingOutlined,
    TeamOutlined,
    TransactionOutlined,
    TruckOutlined,
    UserAddOutlined,
    WalletOutlined,
    YoutubeOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useAuth } from "@web/src/features/auth";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { Menu, type MenuProps } from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

export const SidebarMenu: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const location = useLocation();
    const { close } = useSidebar();
    const { isAdminOrOwner, isStaff } = useAuth();

    const { activeOrganization } = useOrganization();
    const slug = activeOrganization?.slug || "";

    // Strip the org slug prefix from the current pathname to find the matching menu key naturally
    const orgPrefix = slug ? `/org/${slug}` : "";
    let activeKey = location.pathname;
    if (orgPrefix && activeKey.startsWith(orgPrefix)) {
        activeKey = activeKey.replace(orgPrefix, "") || "/";
    }

    // Single-open accordion logic
    const rootSubmenuKeys = ["billing_group", "teaching_group", "admin_group"];
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    // Initialize open keys based on active path
    useEffect(() => {
        if (activeKey.includes("/admin/billing")) {
            setOpenKeys(["billing_group"]);
        } else if (activeKey.includes("/teaching")) {
            setOpenKeys(["teaching_group"]);
        } else if (activeKey.includes("/admin")) {
            setOpenKeys(["admin_group"]);
        }
    }, [activeKey]);

    const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
        const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
        if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
            setOpenKeys(keys);
        } else {
            setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }
    };

    const menuItems: MenuProps["items"] = [
        {
            label: "Dashboard",
            key: AppRoutes.org.dashboard.index,
            icon: <DashboardOutlined />,
            disabled: !slug,
        },
        ...(!isStaff
            ? [
                  {
                      label: "Lessons",
                      key: AppRoutes.org.dashboard.lessons,
                      icon: <BookOutlined />,
                      disabled: !slug,
                  },
              ]
            : []),
        {
            label: "Shop",
            key: AppRoutes.org.dashboard.shop,
            icon: <ShoppingOutlined />,
            disabled: !slug,
        },
        {
            label: "Wallet",
            key: AppRoutes.org.dashboard.wallet,
            icon: <WalletOutlined />,
            disabled: !slug,
        },
        {
            label: "Movies",
            key: AppRoutes.org.dashboard.movies,
            icon: <YoutubeOutlined />,
            disabled: !slug,
        },
        {
            label: "Orders",
            key: AppRoutes.org.dashboard.orders,
            icon: <TruckOutlined />,
            disabled: !slug,
        },
        {
            type: "divider",
        },
        ...(activeOrganization && isStaff
            ? [
                  ...(isAdminOrOwner
                      ? [
                            {
                                label: "Billing",
                                key: "billing_group",
                                icon: <DollarOutlined />,
                                children: [
                                    {
                                        label: "Transactions",
                                        key: AppRoutes.org.admin.billing.transactions,
                                        icon: <TransactionOutlined />,
                                    },
                                    {
                                        label: "Accounts",
                                        key: AppRoutes.org.admin.billing.accounts,
                                        icon: <BankOutlined />,
                                    },
                                    {
                                        label: "Plans",
                                        key: AppRoutes.org.admin.billing.plans,
                                        icon: <OrderedListOutlined />,
                                    },
                                ],
                            },
                        ]
                      : []),
                  {
                      label: "Teaching",
                      key: "teaching_group",
                      icon: <BookOutlined />,
                      children: [
                          {
                              label: "Schedule",
                              key: AppRoutes.org.teaching.schedule,
                              icon: <CalendarOutlined />,
                          },
                          {
                              label: "Lessons",
                              key: AppRoutes.org.teaching.lessons,
                              icon: <PictureOutlined />,
                          },
                          {
                              label: "Media Library",
                              key: AppRoutes.org.teaching.media,
                              icon: <PlaySquareOutlined />,
                          },
                          {
                              label: "Playlists",
                              key: AppRoutes.org.teaching.playlists,
                              icon: <OrderedListOutlined />,
                          },
                          {
                              label: "Class Roster",
                              key: AppRoutes.org.teaching.students,
                              icon: <TeamOutlined />,
                          },
                      ],
                  },
                  ...(isAdminOrOwner
                      ? [
                            {
                                label: "Admin",
                                key: "admin_group",
                                icon: <SettingOutlined />,
                                children: [
                                    {
                                        label: "Analytics",
                                        key: AppRoutes.org.admin.analytics,
                                        icon: <AreaChartOutlined />,
                                    },
                                    {
                                        label: "Members",
                                        key: AppRoutes.org.admin.members,
                                        icon: <TeamOutlined />,
                                    },
                                    {
                                        label: "Invitations",
                                        key: AppRoutes.org.admin.invitations,
                                        icon: <UserAddOutlined />,
                                    },
                                    {
                                        label: "Bulk Import",
                                        key: AppRoutes.org.admin.bulk,
                                        icon: <CloudUploadOutlined />,
                                    },
                                    {
                                        label: "Organizations",
                                        key: AppRoutes.org.admin.index,
                                        icon: <BankOutlined />,
                                        disabled: !slug,
                                    },
                                    {
                                        label: "Files & Uploads",
                                        key: AppRoutes.org.admin.uploads,
                                        icon: <CloudUploadOutlined />,
                                    },
                                ],
                            },
                        ]
                      : []),
              ]
            : []),
    ];

    const handleMenuClick = (e: { key: string }) => {
        // Disregard non-routable group keys
        if (e.key === "teaching_group" || e.key === "admin_group" || e.key === "billing_group")
            return;

        navigateOrg(e.key);
        close();
    };

    return (
        <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            style={{ height: "100%", borderRight: 0 }}
            onClick={handleMenuClick}
            items={menuItems}
        />
    );
};
