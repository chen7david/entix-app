import { CheckOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Grid, Typography, theme } from "antd";
import type React from "react";
import type { CurrencyWithStatus } from "../hooks/useOrgCurrencies";

const { Text } = Typography;

type Props = {
    currency: CurrencyWithStatus;
    onActivate: (id: string) => void;
    onClick?: () => void;
    loading?: boolean;
};

export const AvailableCurrencyCard: React.FC<Props> = ({
    currency,
    onActivate,
    loading,
    onClick,
}) => {
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();
    const isActivated = currency.isActivated;

    return (
        <Card
            size="small"
            hoverable
            onClick={isActivated ? onClick : undefined}
            style={{
                height: "100%",
                borderRadius: 12,
                transition: "all 0.2s ease-in-out",
                background: isActivated ? token.colorFillTertiary : token.colorFillQuaternary,
                border: isActivated
                    ? `1px solid ${token.colorBorder}`
                    : `1px dashed ${token.colorBorder}`,
                boxShadow: "none",
            }}
            styles={{
                body: {
                    padding: screens.md ? "16px" : "12px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                },
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px 0 24px",
                    }}
                >
                    <div
                        style={{
                            fontSize: 40,
                            marginBottom: 4,
                            opacity: isActivated ? 0.2 : 0.1,
                            fontWeight: 800,
                        }}
                    >
                        {currency.symbol}
                    </div>
                    <Text
                        strong
                        style={{
                            fontSize: 18,
                            color: isActivated ? token.colorText : token.colorTextSecondary,
                            marginBottom: 2,
                        }}
                    >
                        {currency.code}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, opacity: 0.7 }}>
                        {currency.name}
                    </Text>
                </div>
                {isActivated ? (
                    <Button
                        disabled
                        size="middle"
                        icon={<CheckOutlined />}
                        block
                        style={{
                            borderRadius: 8,
                            fontWeight: 600,
                            height: 44,
                            backgroundColor: token.colorFillSecondary,
                            color: token.colorTextDisabled,
                            border: "none",
                        }}
                    >
                        Active
                    </Button>
                ) : (
                    <Button
                        type="primary"
                        size="middle"
                        icon={<PlusOutlined />}
                        loading={loading}
                        onClick={(e) => {
                            e.stopPropagation();
                            onActivate(currency.id);
                        }}
                        block
                        style={{
                            borderRadius: 8,
                            fontWeight: 600,
                            height: 44,
                            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                        }}
                    >
                        Activate Wallet
                    </Button>
                )}
            </div>
        </Card>
    );
};
