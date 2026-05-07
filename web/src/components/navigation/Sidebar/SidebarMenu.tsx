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
    ShoppingOutlined,
    TeamOutlined,
    TransactionOutlined,
    TruckOutlined,
    UserAddOutlined,
    WalletOutlined,
    YoutubeOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrganization, useOrgNavigate, useOrgRole } from "@web/src/features/organization";
import { useSidebar } from "@web/src/hooks/navigation/useSidebar";
import { Menu, type MenuProps } from "antd";
import type React from "react";
import { useLocation } from "react-router";

export const SidebarMenu: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const location = useLocation();
    const { close } = useSidebar();
    const { isAdminOrOwner, isStaff, isStudent } = useOrgRole();
    const { activeOrganization } = useOrganization();
    const slug = activeOrganization?.slug || "";

    const orgPrefix = slug ? `/org/${slug}` : "";
    let activeKey = location.pathname;
    if (orgPrefix && activeKey.startsWith(orgPrefix)) {
        activeKey = activeKey.replace(orgPrefix, "") || "/";
    }

    const handleMenuClick = (e: { key: string }) => {
        navigateOrg(e.key);
        close();
    };

    const learningItems: MenuProps["items"] = isStudent
        ? [
              {
                  type: "group",
                  label: "Learning",
                  children: [
                      {
                          label: "My Lessons",
                          key: AppRoutes.org.dashboard.lessons,
                          icon: <BookOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Movies",
                          key: AppRoutes.org.dashboard.movies,
                          icon: <YoutubeOutlined />,
                          disabled: !slug,
                      },
                  ],
              },
          ]
        : [];

    const studentFinanceItems: MenuProps["items"] = isStudent
        ? [
              {
                  type: "group",
                  label: "Finance",
                  children: [
                      {
                          label: "Wallet",
                          key: AppRoutes.org.dashboard.wallet,
                          icon: <WalletOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Shop",
                          key: AppRoutes.org.dashboard.shop,
                          icon: <ShoppingOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Orders",
                          key: AppRoutes.org.dashboard.orders,
                          icon: <TruckOutlined />,
                          disabled: !slug,
                      },
                  ],
              },
          ]
        : [];

    const classroomItems: MenuProps["items"] = isStaff
        ? [
              {
                  type: "group",
                  label: "Classroom",
                  children: [
                      {
                          label: "Sessions",
                          key: AppRoutes.org.teaching.sessions,
                          icon: <CalendarOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Lessons",
                          key: AppRoutes.org.teaching.lessons,
                          icon: <BookOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Vocabulary",
                          key: AppRoutes.org.teaching.vocabulary,
                          icon: <OrderedListOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Class Roster",
                          key: AppRoutes.org.teaching.students,
                          icon: <TeamOutlined />,
                          disabled: !slug,
                      },
                  ],
              },
          ]
        : [];

    const contentItems: MenuProps["items"] = isStaff
        ? [
              {
                  type: "group",
                  label: "Content",
                  children: [
                      {
                          label: "Media Library",
                          key: AppRoutes.org.teaching.media,
                          icon: <PlaySquareOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Playlists",
                          key: AppRoutes.org.teaching.playlists,
                          icon: <PictureOutlined />,
                          disabled: !slug,
                      },
                  ],
              },
          ]
        : [];

    const operationsItems: MenuProps["items"] = isAdminOrOwner
        ? [
              {
                  type: "group",
                  label: "Operations",
                  children: [
                      {
                          label: "Analytics",
                          key: AppRoutes.org.admin.analytics,
                          icon: <AreaChartOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Members",
                          key: AppRoutes.org.admin.members,
                          icon: <TeamOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Invitations",
                          key: AppRoutes.org.admin.invitations,
                          icon: <UserAddOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Bulk Import",
                          key: AppRoutes.org.admin.bulk,
                          icon: <CloudUploadOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Files & Uploads",
                          key: AppRoutes.org.admin.uploads,
                          icon: <CloudUploadOutlined />,
                          disabled: !slug,
                      },
                  ],
              },
          ]
        : [];

    const billingItems: MenuProps["items"] = isAdminOrOwner
        ? [
              {
                  type: "group",
                  label: "Finance",
                  children: [
                      {
                          label: "Transactions",
                          key: AppRoutes.org.admin.billing.transactions,
                          icon: <TransactionOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Accounts",
                          key: AppRoutes.org.admin.billing.accounts,
                          icon: <BankOutlined />,
                          disabled: !slug,
                      },
                      {
                          label: "Plans",
                          key: AppRoutes.org.admin.billing.plans,
                          icon: <DollarOutlined />,
                          disabled: !slug,
                      },
                  ],
              },
          ]
        : [];

    const menuItems: MenuProps["items"] = [
        {
            label: "Dashboard",
            key: AppRoutes.org.dashboard.index,
            icon: <DashboardOutlined />,
            disabled: !slug,
        },
        ...learningItems,
        ...studentFinanceItems,
        ...classroomItems,
        ...contentItems,
        ...operationsItems,
        ...billingItems,
    ];

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
