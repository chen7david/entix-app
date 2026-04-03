import { LockOutlined, WalletOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG, type WalletAccountDTO } from "@shared";
import { Card, Flex, Space, Statistic, Tag, Typography, theme } from "antd";
import type React from "react";

const { Text } = Typography;

interface FinancialAccountCardProps {
    account: WalletAccountDTO;
    onClick: (account: WalletAccountDTO) => void;
    lowBalanceThresholdCents?: number;
    badgeLabel?: string;
    isPrimaryBranding?: boolean;
}

const getCurrencyColor = (currencyId: string) => {
    const id = currencyId.toLowerCase();
    if (id.includes("aud")) return "#00843D";
    if (id.includes("usd")) return "#2e7d32";
    if (id.includes("eur")) return "#1565c0";
    if (id.includes("btc")) return "#f57c00";
    if (id.includes("eth")) return "#673ab7";
    if (id.includes("srd")) return "#c62828";
    if (id.includes("cny")) return "#d32f2f";
    if (id.includes("etd")) return "#0288d1";
    if (id.includes("cad")) return "#004792";
    return undefined;
};

export const FinancialAccountCard: React.FC<FinancialAccountCardProps> = ({
    account,
    onClick,
    lowBalanceThresholdCents = 100_000_00, // Default to $1,000 if not provided
    badgeLabel,
    isPrimaryBranding,
}) => {
    const { token } = theme.useToken();
    const config =
        FINANCIAL_CURRENCY_CONFIG[account.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];
    const isLowBalance = account.balanceCents < lowBalanceThresholdCents;
    const isFunding = account.isFundingAccount;
    const currencyColor = getCurrencyColor(account.currencyId);
    const treasuryColor = "#00843D";

    // Use primary theme color if branding is requested
    const effectiveColor = isPrimaryBranding
        ? token.colorPrimary
        : badgeLabel === "TREASURY"
          ? treasuryColor
          : currencyColor;

    return (
        <Card
            hoverable
            onClick={() => onClick(account)}
            style={{
                borderRadius: 12,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: token.colorBgContainer,
                border: `1px solid ${isLowBalance ? token.colorWarning : effectiveColor ? `${effectiveColor}66` : token.colorBorderSecondary}`,
                boxShadow: `0 4px 12px -2px ${effectiveColor ? `${effectiveColor}12` : "rgba(0, 0, 0, 0.05)"}`,
                height: "100%",
            }}
            styles={{
                body: {
                    padding: "16px",
                },
            }}
        >
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Space align="center" size={10}>
                    {isFunding ? (
                        <LockOutlined
                            style={{ color: effectiveColor || token.colorPrimary, fontSize: 13 }}
                        />
                    ) : (
                        <WalletOutlined
                            style={{
                                color: effectiveColor || token.colorTextTertiary,
                                fontSize: 13,
                            }}
                        />
                    )}
                    <Text
                        strong
                        style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: effectiveColor
                                ? `${effectiveColor}CC`
                                : token.colorTextQuaternary,
                        }}
                    >
                        {isFunding ? "General Fund" : "Custom Account"}
                    </Text>
                </Space>
                {(isFunding || badgeLabel) && (
                    <Tag
                        style={{
                            margin: 0,
                            fontSize: 9,
                            fontWeight: 800,
                            borderRadius: 4,
                            padding: "0 8px",
                            backgroundColor: (
                                badgeLabel === "TREASURY"
                                    ? treasuryColor
                                    : currencyColor
                            )
                                ? `${badgeLabel === "TREASURY" ? treasuryColor : currencyColor}12`
                                : undefined,
                            color:
                                (badgeLabel === "TREASURY" ? treasuryColor : currencyColor) ||
                                token.colorPrimary,
                            borderColor: (badgeLabel === "TREASURY" ? treasuryColor : currencyColor)
                                ? `${badgeLabel === "TREASURY" ? treasuryColor : currencyColor}33`
                                : undefined,
                            textTransform: "uppercase",
                        }}
                    >
                        {badgeLabel || "DEFAULT"}
                    </Tag>
                )}
            </Flex>

            <Statistic
                title={
                    <Text
                        strong
                        style={{ fontSize: 14, display: "block", marginBottom: 4 }}
                        title={account.name}
                        ellipsis
                    >
                        {account.name}
                    </Text>
                }
                value={account.balanceCents / 100}
                formatter={(value) => (
                    <span
                        style={{
                            fontSize: "18px", // Reduced for large numbers as requested
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
                suffix={
                    <Text
                        style={{
                            fontSize: 12,
                            marginLeft: 4,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            color: effectiveColor || token.colorTextSecondary,
                            opacity: 0.8,
                        }}
                    >
                        {config?.code ?? account.currencyId.split("_").pop()}
                    </Text>
                }
                prefix={
                    <Text
                        type="secondary"
                        style={{
                            fontSize: 12,
                            marginRight: 4,
                        }}
                    >
                        {config?.symbol}
                    </Text>
                }
            />

            <Flex
                justify="space-between"
                align="center"
                style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Text
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: token.colorTextQuaternary,
                            textTransform: "uppercase",
                        }}
                    >
                        ID
                    </Text>
                    <Text
                        style={{
                            fontSize: 10,
                            opacity: 0.3,
                            fontFamily: "monospace",
                            color: token.colorTextSecondary,
                        }}
                    >
                        {account.id.split("_").pop()?.slice(0, 8).toUpperCase()}
                    </Text>
                </div>
                {isLowBalance && !isFunding && (
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
