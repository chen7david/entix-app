import {
    AreaChartOutlined,
    BankOutlined,
    BookOutlined,
    CalendarOutlined,
    DashboardOutlined,
    DollarOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    ImportOutlined,
    OrderedListOutlined,
    PictureOutlined,
    PlaySquareOutlined,
    SettingOutlined,
    TeamOutlined,
    TransactionOutlined,
    UserAddOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import type { ReactNode } from "react";

export type OrgNavItem = {
    key: string;
    label: string;
    icon: ReactNode;
};

export type OrgNavGroup = {
    type: "group";
    label: string;
    children: OrgNavItem[];
};

export type OrgNavRoleFlags = {
    isStudent: boolean;
    isTeacher: boolean;
    isAdminOrOwner: boolean;
    isFinance: boolean;
    isFinanceStaff: boolean;
    isStaff: boolean;
};

/** Role-shaped sidebar groups: each persona only sees their jobs. */
export function buildOrgSidebarGroups(flags: OrgNavRoleFlags): OrgNavGroup[] {
    const groups: OrgNavGroup[] = [];

    if (flags.isStudent) {
        groups.push({
            type: "group",
            label: "Learning",
            children: [
                {
                    label: "My Lessons",
                    key: AppRoutes.org.dashboard.lessons,
                    icon: <BookOutlined />,
                },
                {
                    label: "My Schedule",
                    key: AppRoutes.org.dashboard.mySchedule,
                    icon: <CalendarOutlined />,
                },
            ],
        });
    }

    if (flags.isStaff) {
        groups.push({
            type: "group",
            label: "Classroom",
            children: [
                {
                    label: "Sessions",
                    key: AppRoutes.org.teaching.sessions,
                    icon: <CalendarOutlined />,
                },
                {
                    label: "Lessons",
                    key: AppRoutes.org.teaching.lessons,
                    icon: <BookOutlined />,
                },
                {
                    label: "Vocabulary",
                    key: AppRoutes.org.teaching.vocabulary,
                    icon: <OrderedListOutlined />,
                },
                {
                    label: flags.isAdminOrOwner ? "People" : "Students",
                    key: flags.isAdminOrOwner
                        ? AppRoutes.org.admin.members
                        : AppRoutes.org.teaching.students,
                    icon: <TeamOutlined />,
                },
            ],
        });

        groups.push({
            type: "group",
            label: "Content",
            children: [
                {
                    label: "Media Library",
                    key: AppRoutes.org.teaching.media,
                    icon: <PlaySquareOutlined />,
                },
                {
                    label: "Playlists",
                    key: AppRoutes.org.teaching.playlists,
                    icon: <PictureOutlined />,
                },
                {
                    label: "Text library",
                    key: AppRoutes.org.teaching.textLibrary,
                    icon: <FileTextOutlined />,
                },
            ],
        });
    }

    if (flags.isAdminOrOwner) {
        groups.push({
            type: "group",
            label: "Operations",
            children: [
                {
                    label: "Analytics",
                    key: AppRoutes.org.admin.analytics,
                    icon: <AreaChartOutlined />,
                },
                {
                    label: "Invitations",
                    key: AppRoutes.org.admin.invitations,
                    icon: <UserAddOutlined />,
                },
                {
                    label: "Bulk Import",
                    key: AppRoutes.org.admin.bulk,
                    icon: <ImportOutlined />,
                },
                {
                    label: "Files & Uploads",
                    key: AppRoutes.org.admin.uploads,
                    icon: <FolderOpenOutlined />,
                },
            ],
        });
    }

    if (flags.isFinanceStaff) {
        groups.push({
            type: "group",
            label: "Finance",
            children: [
                ...(flags.isFinance && !flags.isAdminOrOwner
                    ? [
                          {
                              label: "Members",
                              key: AppRoutes.org.admin.members,
                              icon: <TeamOutlined />,
                          },
                      ]
                    : []),
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
                    icon: <DollarOutlined />,
                },
            ],
        });
    }

    return groups;
}

/** Primary mobile tabs per role (max ~4). */
export function buildOrgMobileTabs(flags: OrgNavRoleFlags): OrgNavItem[] {
    if (flags.isAdminOrOwner) {
        return [
            { key: AppRoutes.org.dashboard.index, label: "Home", icon: <DashboardOutlined /> },
            { key: AppRoutes.org.teaching.sessions, label: "Sessions", icon: <CalendarOutlined /> },
            { key: AppRoutes.org.admin.members, label: "People", icon: <TeamOutlined /> },
            {
                key: AppRoutes.org.admin.billing.transactions,
                label: "Finance",
                icon: <TransactionOutlined />,
            },
        ];
    }

    if (flags.isFinance) {
        return [
            { key: AppRoutes.org.dashboard.index, label: "Home", icon: <DashboardOutlined /> },
            { key: AppRoutes.org.admin.members, label: "Members", icon: <TeamOutlined /> },
            {
                key: AppRoutes.org.admin.billing.transactions,
                label: "Ledger",
                icon: <TransactionOutlined />,
            },
            { key: AppRoutes.org.admin.billing.plans, label: "Plans", icon: <DollarOutlined /> },
        ];
    }

    if (flags.isTeacher || flags.isStaff) {
        return [
            { key: AppRoutes.org.dashboard.index, label: "Home", icon: <DashboardOutlined /> },
            { key: AppRoutes.org.teaching.sessions, label: "Sessions", icon: <CalendarOutlined /> },
            { key: AppRoutes.org.teaching.students, label: "Students", icon: <TeamOutlined /> },
            { key: AppRoutes.org.teaching.lessons, label: "Lessons", icon: <BookOutlined /> },
        ];
    }

    // Student — learning first
    return [
        { key: AppRoutes.org.dashboard.index, label: "Home", icon: <DashboardOutlined /> },
        { key: AppRoutes.org.dashboard.lessons, label: "Lessons", icon: <BookOutlined /> },
        {
            key: AppRoutes.org.dashboard.mySchedule,
            label: "Schedule",
            icon: <CalendarOutlined />,
        },
        { key: AppRoutes.org.dashboard.settings, label: "Settings", icon: <SettingOutlined /> },
    ];
}
