import { CheckCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Statistic, Tag, Typography, theme } from "antd";
import type React from "react";
import type { CurrencyWithStatus } from "../hooks/useOrgCurrencies";

const { Text } = Typography;

type Props = {
    currencies: CurrencyWithStatus[];
    onActivate: (currencyId: string) => void;
    activating?: boolean;
};

export const CurrencyActivationGrid: React.FC<Props> = ({ currencies, onActivate, activating }) => {
    const { token } = theme.useToken();
    return (
        <Row gutter={[24, 24]}>
            {currencies.map((currency) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={currency.id}>
                    <Card
                        size="small"
                        hoverable
                        style={{
                            height: "100%",
                            borderRadius: 16,
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            // Active: White + Soft Shadow | Inactive: Muted BG
                            background: currency.isActivated
                                ? "#FFFFFF"
                                : token.colorFillQuaternary,
                            border: currency.isActivated
                                ? "1px solid rgba(0,0,0,0.08)"
                                : "1px solid transparent",
                            boxShadow: currency.isActivated
                                ? "0 4px 18px -4px rgba(0,0,0,0.06), 0 2px 8px -2px rgba(0,0,0,0.04)"
                                : "none",
                        }}
                        styles={{
                            body: {
                                padding: "24px",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            },
                        }}
                    >
                        {currency.isActivated ? (
                            <>
                                <div style={{ marginBottom: 20 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: 12,
                                        }}
                                    >
                                        <Text
                                            strong
                                            style={{
                                                fontSize: 11,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em",
                                                color: token.colorTextTertiary,
                                            }}
                                        >
                                            {currency.name}
                                        </Text>
                                        <Tag
                                            bordered={false}
                                            icon={<CheckCircleOutlined />}
                                            style={{
                                                margin: 0,
                                                fontSize: 10,
                                                borderRadius: 6,
                                                fontWeight: 700,
                                                background: "#ECFDF5", // Light Emerald
                                                color: "#059669", // Emerald 600
                                                padding: "2px 8px",
                                            }}
                                        >
                                            ACTIVE
                                        </Tag>
                                    </div>
                                    <Statistic
                                        value={(currency.balanceCents ?? 0) / 100}
                                        precision={2}
                                        prefix={
                                            <Text
                                                type="secondary"
                                                style={{
                                                    marginRight: 8,
                                                    fontSize: 18,
                                                    color: token.colorTextTertiary,
                                                }}
                                            >
                                                {currency.symbol}
                                            </Text>
                                        }
                                        suffix={
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    color: token.colorTextTertiary,
                                                }}
                                            >
                                                {currency.code}
                                            </Text>
                                        }
                                        valueStyle={{
                                            fontSize: 32,
                                            fontWeight: 850,
                                            letterSpacing: "-0.03em",
                                            color: token.colorText,
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingTop: 16,
                                        borderTop: "1px solid rgba(0,0,0,0.04)",
                                    }}
                                >
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: token.colorTextQuaternary,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        System Primary
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            opacity: 0.3,
                                            fontFamily: "monospace",
                                            color: token.colorTextSecondary,
                                        }}
                                    >
                                        {currency.accountId?.split("_").pop()?.toUpperCase()}
                                    </Text>
                                </div>
                            </>
                        ) : (
                            <div
                                style={{ display: "flex", flexDirection: "column", height: "100%" }}
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
                                            opacity: 0.1,
                                            fontWeight: 800,
                                        }}
                                    >
                                        {currency.symbol}
                                    </div>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 18,
                                            color: token.colorTextSecondary,
                                            marginBottom: 2,
                                        }}
                                    >
                                        {currency.code}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12, opacity: 0.7 }}>
                                        {currency.name}
                                    </Text>
                                </div>
                                <Button
                                    type="primary"
                                    size="middle"
                                    icon={<PlusOutlined />}
                                    loading={activating}
                                    onClick={() => onActivate(currency.id)}
                                    block
                                    style={{
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        height: 40,
                                        boxShadow: "0 2px 0 rgba(0,0,0,0.02)",
                                    }}
                                >
                                    Activate Wallet
                                </Button>
                            </div>
                        )}
                    </Card>
                </Col>
            ))}
        </Row>
    );
};
