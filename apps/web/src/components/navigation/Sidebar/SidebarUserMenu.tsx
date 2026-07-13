import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LogoutOutlined,
    MoonOutlined,
    SafetyOutlined,
    SettingOutlined,
    SunOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { AppRoutes, FINANCIAL_CURRENCIES, getAvatarUrl } from "@shared";
import { useAuth, useSignOut } from "@web/src/features/auth";
import { useOrganization, useOrgRole } from "@web/src/features/organization";
import { useWalletBalance } from "@web/src/features/wallet";
import { useTheme } from "@web/src/hooks/useTheme";
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

const { Text } = Typography;

export const SidebarUserMenu: React.FC = () => {
    const { user, isLoading: isAuthLoading, isSuperAdmin } = useAuth();
    const { isFinanceStaff, isStudent } = useOrgRole();
    const { data: session } = useSession();
    const { mutate: signOut } = useSignOut();
    const { activeOrganization } = useOrganization();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const slug = activeOrganization?.slug || "";
    const { token } = theme.useToken();

    const [isBalanceVisible, setIsBalanceVisible] = useState(() => {
        if (typeof window === "undefined") return true;
        // New key so prior default-hidden preference does not stick.
        return localStorage.getItem("entix_points_hidden") !== "true";
    });

    useEffect(() => {
        localStorage.setItem("entix_points_hidden", isBalanceVisible ? "false" : "true");
    }, [isBalanceVisible]);

    const userId = session?.user?.id;
    const orgId = activeOrganization?.id;
    const showEntixPoints = isStudent || isFinanceStaff;

    const {
        data: summary,
        isLoading: isWalletLoading,
        isError,
    } = useWalletBalance(showEntixPoints ? userId : undefined, "user", orgId);

    const etdAccount = summary?.accounts.find((a) => a.currencyId === FINANCIAL_CURRENCIES.ETD);
    const hasWallet = !!etdAccount;
    const balanceValue = etdAccount ? (etdAccount.balanceCents / 100).toFixed(2) : "0.00";
    const showPointsRow = showEntixPoints && !isError;

    const handleMenuClick: MenuProps["onClick"] = (e) => {
        if (e.key === "logout") {
            signOut(undefined, {
                onSuccess: () => {
                    navigate(AppRoutes.auth.signIn);
                },
            });
            return;
        }
        if (e.key === "theme") {
            toggleTheme();
            return;
        }
        navigate(e.key);
    };

    const userMenuItems: MenuProps["items"] = [
        ...(isSuperAdmin
            ? [
                  {
                      key: AppRoutes.admin.index,
                      label: "Platform dashboard",
                      icon: <SafetyOutlined style={{ color: token.colorWarning }} />,
                  },
                  { type: "divider" as const },
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
                      label: "Account security",
                      icon: <SafetyOutlined />,
                  },
                  {
                      key: `/org/${slug}${AppRoutes.org.dashboard.settings}`,
                      label: "Settings",
                      icon: <SettingOutlined />,
                  },
                  { type: "divider" as const },
              ]
            : []),
        {
            key: "theme",
            label: isDark ? "Light mode" : "Dark mode",
            icon: isDark ? <SunOutlined /> : <MoonOutlined />,
        },
        { type: "divider" as const },
        {
            key: "logout",
            label: "Sign out",
            icon: <LogoutOutlined />,
            danger: true,
        },
    ];

    if (isAuthLoading) {
        return (
            <div className="px-3 py-3">
                <Skeleton active avatar paragraph={{ rows: 1 }} title={false} />
            </div>
        );
    }

    return (
        <Dropdown
            menu={{ items: userMenuItems, onClick: handleMenuClick }}
            trigger={["click"]}
            placement="topLeft"
        >
            <button
                type="button"
                aria-label="Account menu"
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-left transition-colors cursor-pointer"
                style={{
                    background: "transparent",
                    border: "none",
                    font: "inherit",
                    color: "inherit",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = token.colorFillTertiary;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                }}
            >
                <Avatar
                    size={34}
                    src={user?.image ? getAvatarUrl(user.image, "sm") : undefined}
                    icon={<UserOutlined />}
                    className="shrink-0"
                    style={{ backgroundColor: token.colorPrimary }}
                />
                <div className="min-w-0 flex-1">
                    <Text
                        strong
                        ellipsis
                        style={{ fontSize: 13, lineHeight: "17px", display: "block" }}
                    >
                        {user?.name || "Account"}
                    </Text>
                    {showPointsRow ? (
                        <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                            {isWalletLoading ? (
                                <Text type="secondary" className="text-[11px]">
                                    E$ ——
                                </Text>
                            ) : hasWallet ? (
                                <>
                                    <Text
                                        type="secondary"
                                        className="text-[11px] font-mono truncate"
                                    >
                                        E$ {isBalanceVisible ? balanceValue : "••••••"}
                                    </Text>
                                    <Tooltip
                                        title={isBalanceVisible ? "Hide balance" : "Show balance"}
                                    >
                                        <Button
                                            type="text"
                                            size="small"
                                            className="!h-4 !w-4 !min-w-0 !p-0 flex items-center justify-center"
                                            icon={
                                                isBalanceVisible ? (
                                                    <EyeInvisibleOutlined
                                                        style={{ fontSize: 10 }}
                                                    />
                                                ) : (
                                                    <EyeOutlined style={{ fontSize: 10 }} />
                                                )
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsBalanceVisible((v) => !v);
                                            }}
                                        />
                                    </Tooltip>
                                </>
                            ) : (
                                <Text type="secondary" className="text-[10px] truncate opacity-70">
                                    {isFinanceStaff ? "Wallet not set up" : "No Entix points yet"}
                                </Text>
                            )}
                        </div>
                    ) : (
                        <Text
                            type="secondary"
                            ellipsis
                            style={{ fontSize: 11, lineHeight: "14px", display: "block" }}
                        >
                            {user?.email || "Account"}
                        </Text>
                    )}
                </div>
            </button>
        </Dropdown>
    );
};
