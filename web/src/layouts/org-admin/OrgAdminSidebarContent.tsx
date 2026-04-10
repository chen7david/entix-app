import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LogoutOutlined,
    MoreOutlined,
    SafetyOutlined,
    SettingOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { AppRoutes, FINANCIAL_CURRENCIES, getAvatarUrl } from "@shared";
import { useAuth, useSignOut } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
import { useWalletBalance } from "@web/src/features/wallet";
import { useSession } from "@web/src/lib/auth-client";
import {
    Avatar,
    Button,
    Dropdown,
    type MenuProps,
    Skeleton,
    Tooltip,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { SidebarMenu } from "../../components/navigation/Sidebar/SidebarMenu";
import { SidebarOrgSwitcher } from "../../components/navigation/Sidebar/SidebarOrgSwitcher";

const { Text } = Typography;

export const OrgAdminSidebarContent: React.FC = () => {
    const { user, isLoading: isAuthLoading, isSuperAdmin } = useAuth();
    const { data: session } = useSession();
    const { mutate: signOut } = useSignOut();
    const { activeOrganization } = useOrganization();
    const navigate = useNavigate();
    const slug = activeOrganization?.slug || "";
    const { token } = theme.useToken();

    const [isBalanceVisible, setIsBalanceVisible] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("wallet_balance_visible") === "true";
    });

    useEffect(() => {
        localStorage.setItem("wallet_balance_visible", isBalanceVisible.toString());
    }, [isBalanceVisible]);

    const userId = session?.user?.id;
    const orgId = activeOrganization?.id;

    const {
        data: summary,
        isLoading: isWalletLoading,
        isError,
    } = useWalletBalance(userId, "user", orgId);

    const etdAccount = summary?.accounts.find((a) => a.currencyId === FINANCIAL_CURRENCIES.ETD);
    const hasWallet = !!etdAccount;
    const isAdmin =
        activeOrganization?.members?.find((m: any) => m.userId === userId)?.role === "admin" ||
        activeOrganization?.members?.find((m: any) => m.userId === userId)?.role === "owner";

    const balanceValue = etdAccount ? (etdAccount.balanceCents / 100).toFixed(2) : "0.00";

    const handleMenuClick: MenuProps["onClick"] = (e) => {
        if (e.key === "logout") {
            signOut(undefined, {
                onSuccess: () => {
                    navigate(AppRoutes.auth.signIn);
                },
            });
        } else {
            navigate(e.key);
        }
    };

    const userMenuItems: MenuProps["items"] = [
        ...(isSuperAdmin
            ? [
                  {
                      key: AppRoutes.admin.index,
                      label: "Platform Dashboard",
                      icon: <SafetyOutlined style={{ color: "#faad14" }} />,
                  },
                  {
                      type: "divider" as const,
                  },
              ]
            : []),
        ...(slug
            ? [
                  {
                      key: `/org/${slug}${AppRoutes.org.dashboard.profile}`,
                      label: "Profile",
                      icon: <UserOutlined />,
                  },
                  {
                      key: `/org/${slug}${AppRoutes.org.dashboard.sessions}`,
                      label: "Sessions",
                      icon: <SafetyOutlined />,
                  },
                  {
                      key: `/org/${slug}${AppRoutes.org.dashboard.settings}`,
                      label: "Settings",
                      icon: <SettingOutlined />,
                  },
                  {
                      type: "divider" as const,
                  },
              ]
            : []),
        {
            key: "logout",
            label: "Sign Out",
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* User Profile (Top) */}
            <div className="p-4">
                {isAuthLoading ? (
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                ) : (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar
                            size={40}
                            src={user?.image ? getAvatarUrl(user.image, "sm") : undefined}
                            icon={<UserOutlined />}
                            className="flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                            <Text strong className="truncate text-sm">
                                {user?.name}
                            </Text>

                            {!isError && (
                                <div className="flex items-center gap-2 group">
                                    {isWalletLoading ? (
                                        <Text type="secondary" className="text-xs">
                                            E$ ——
                                        </Text>
                                    ) : hasWallet ? (
                                        <>
                                            <Text type="secondary" className="text-xs font-mono">
                                                E$ {isBalanceVisible ? balanceValue : "••••••"}
                                            </Text>
                                            <Button
                                                type="text"
                                                size="small"
                                                className="h-4 w-4 flex items-center justify-center p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                icon={
                                                    isBalanceVisible ? (
                                                        <EyeInvisibleOutlined
                                                            style={{ fontSize: 10 }}
                                                        />
                                                    ) : (
                                                        <EyeOutlined style={{ fontSize: 10 }} />
                                                    )
                                                }
                                                onClick={() =>
                                                    setIsBalanceVisible(!isBalanceVisible)
                                                }
                                            />
                                        </>
                                    ) : (
                                        <Tooltip
                                            title={
                                                isAdmin
                                                    ? "Go to Members to initialize wallet"
                                                    : undefined
                                            }
                                        >
                                            <Text
                                                type="secondary"
                                                className="text-[10px] opacity-60 italic"
                                            >
                                                {isAdmin
                                                    ? "Wallet not set up — initialize in Members"
                                                    : "Wallet not set up"}
                                            </Text>
                                        </Tooltip>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-2">
                <SidebarMenu />
            </div>

            {/* Footer: Org Switcher & User Menu */}
            <div style={{ borderTop: `1px solid ${token.colorSplit}` }}>
                <div className="flex items-center gap-1 p-2">
                    <div style={{ flex: 1, minWidth: 20 }}>
                        <SidebarOrgSwitcher />
                    </div>
                    <ThemeToggle />
                    <Dropdown
                        menu={{ items: userMenuItems, onClick: handleMenuClick }}
                        trigger={["click"]}
                        placement="topRight"
                    >
                        <Button type="text" icon={<MoreOutlined />} className="flex-shrink-0" />
                    </Dropdown>
                </div>
            </div>
        </div>
    );
};
