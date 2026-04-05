import { LockOutlined, WalletOutlined } from "@ant-design/icons";
import { ACCOUNT_TYPES, FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { Card, Flex, Skeleton, Space, Statistic, Tag, Typography, theme } from "antd";
import type React from "react";

const { Text } = Typography;

import type { AccountType } from "@shared";

export interface FinancialAccountData {
    id: string;
    name: string;
    balanceCents: number;
    currencyId: string;
    accountType: AccountType;
    orgId?: string | null;
}

export type AccountState = "active" | "available" | "loading";

interface FinancialAccountCardProps {
    account: FinancialAccountData;
    accountState: AccountState;
    onClick?: (account: FinancialAccountData) => void;
    lowBalanceThresholdCents?: number;
    isPrimaryBranding?: boolean;
    showLowBalanceWarning?: boolean;
}

const ACCOUNT_TYPE_CONFIG: Record<
    AccountType,
    { color: string; badgeLabel: string; displayLabel: string }
> = {
    [ACCOUNT_TYPES.TREASURY]: {
        color: "#059669",
        badgeLabel: "TREASURY",
        displayLabel: "Treasury Vault",
    },
    [ACCOUNT_TYPES.FUNDING]: {
        color: "#3b82f6",
        badgeLabel: "FUNDING",
        displayLabel: "General Fund",
    },
    [ACCOUNT_TYPES.SAVINGS]: {
        color: "#8b5cf6",
        badgeLabel: "SAVINGS",
        displayLabel: "Personal Wallet",
    },
    [ACCOUNT_TYPES.SYSTEM]: {
        color: "#6b7280",
        badgeLabel: "SYSTEM",
        displayLabel: "System Offset",
    },
};

export const FinancialAccountCard: React.FC<FinancialAccountCardProps> = ({
    account,
    accountState,
    onClick,
    lowBalanceThresholdCents = 100_000,
    isPrimaryBranding = false,
    showLowBalanceWarning = true,
}) => {
    const { token } = theme.useToken();
    // Loading Guard: Must come before accessing account properties to prevent crashes
    if (accountState === "loading") {
        return (
            <Card
                style={{ borderRadius: 12, height: "100%" }}
                styles={{ body: { padding: "16px" } }}
            >
                {/* Header: icon + text + badge skeletons */}
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <Space align="center" size={10}>
                        <Skeleton.Avatar active size="small" shape="circle" />
                        <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
                    </Space>
                    <Skeleton.Button active size="small" style={{ width: 60, height: 16 }} />
                </Flex>

                {/* Body: title + balance skeletons */}
                <div style={{ marginBottom: 20 }}>
                    <Skeleton.Input
                        active
                        size="small"
                        style={{ width: "40%", height: 12, marginBottom: 8, display: "block" }}
                    />
                    <Skeleton.Input active size="large" style={{ width: "70%", height: 32 }} />
                </div>

                {/* Footer skeletons */}
                <Flex
                    justify="space-between"
                    align="center"
                    style={{
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Skeleton.Input active size="small" style={{ width: 100, height: 14 }} />
                </Flex>
            </Card>
        );
    }

    const config =
        FINANCIAL_CURRENCY_CONFIG[account.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];

    const typeConfig = ACCOUNT_TYPE_CONFIG[account.accountType];
    const accentColor = isPrimaryBranding ? token.colorPrimary : typeConfig.color;

    const isLowBalance = account.balanceCents < lowBalanceThresholdCents;

    // Active or Available (Deactivated)
    const isAvailable = accountState === "available";

    return (
        <Card
            hoverable={!isAvailable && !!onClick}
            onClick={() => !isAvailable && onClick?.(account)}
            style={{
                borderRadius: 12,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: token.colorBgContainer,
                border: `1px solid ${isLowBalance ? token.colorWarning : `${accentColor}66`}`,
                boxShadow: `0 4px 12px -2px ${accentColor}12`,
                height: "100%",
                opacity: isAvailable ? 0.6 : 1,
                filter: isAvailable ? "grayscale(40%)" : "none",
                cursor: isAvailable ? "not-allowed" : "pointer",
            }}
            styles={{ body: { padding: "16px" } }}
        >
            {/* Header: icon + displayLabel + TYPE badge */}
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Space align="center" size={10}>
                    {account.accountType === "funding" ? (
                        <LockOutlined style={{ color: accentColor, fontSize: 13 }} />
                    ) : (
                        <WalletOutlined style={{ color: accentColor, fontSize: 13 }} />
                    )}
                    <Text
                        strong
                        style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: `${accentColor}CC`,
                        }}
                    >
                        {typeConfig.displayLabel}
                    </Text>
                </Space>

                <Space>
                    {isAvailable && (
                        <Tag color="default" style={{ margin: 0, fontSize: 9, fontWeight: 800 }}>
                            DEACTIVATED
                        </Tag>
                    )}
                    <Tag
                        style={{
                            margin: 0,
                            fontSize: 9,
                            fontWeight: 800,
                            borderRadius: 4,
                            padding: "0 8px",
                            textTransform: "uppercase",
                            backgroundColor: `${accentColor}12`,
                            color: accentColor,
                            borderColor: `${accentColor}33`,
                        }}
                    >
                        {typeConfig.badgeLabel}
                    </Tag>
                </Space>
            </Flex>

            {/* Balance */}
            <Statistic
                title={
                    <Text
                        strong
                        ellipsis
                        title={account.name}
                        style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                    >
                        {account.name}
                    </Text>
                }
                value={account.balanceCents / 100}
                formatter={(value) => (
                    <span
                        style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: token.colorTextHeading,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {Number(value).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                )}
                prefix={
                    <Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
                        {config?.symbol}
                    </Text>
                }
                suffix={
                    <Text
                        style={{
                            fontSize: 12,
                            marginLeft: 4,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            color: accentColor,
                            opacity: 0.8,
                        }}
                    >
                        {config?.code ?? account.currencyId.split("_").pop()}
                    </Text>
                }
            />

            {/* Footer */}
            <Flex
                justify="space-between"
                align="center"
                style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Space size={6} align="center">
                    <Text
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: token.colorTextQuaternary,
                        }}
                    >
                        ID
                    </Text>
                    <Text
                        style={{
                            fontSize: 10,
                            fontFamily: "monospace",
                            color: token.colorTextSecondary,
                            opacity: 0.4,
                        }}
                    >
                        {account.id.slice(-8).toUpperCase()}
                    </Text>
                </Space>
                {isLowBalance && showLowBalanceWarning && (
                    <Tag
                        color="warning"
                        bordered={false}
                        style={{ margin: 0, fontSize: 10, fontWeight: 600 }}
                    >
                        LOW BALANCE
                    </Tag>
                )}
            </Flex>
        </Card>
    );
};
