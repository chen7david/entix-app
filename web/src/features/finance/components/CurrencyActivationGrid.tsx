import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Flex, Grid, Row, Statistic, Typography, theme } from "antd";
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
    const screens = Grid.useBreakpoint();

    if (currencies.length === 0) {
        return (
            <div className="py-12 border border-dashed rounded-xl flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50">
                <Empty
                    description={
                        <Text type="secondary" className="text-xs">
                            No currencies available for this action.
                        </Text>
                    }
                />
            </div>
        );
    }

    return (
        <Row gutter={[24, 24]}>
            {currencies.map((currency) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={currency.id}>
                    <Card
                        size="small"
                        hoverable
                        style={{
                            height: "100%",
                            borderRadius: 12,
                            transition: "all 0.2s ease-in-out",
                            background: currency.isActivated
                                ? token.colorBgContainer
                                : token.colorFillQuaternary,
                            border: currency.isActivated
                                ? `1px solid ${token.colorBorderSecondary}`
                                : `1px dashed ${token.colorBorder}`,
                            boxShadow: currency.isActivated
                                ? "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
                                : "none",
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
                                                fontSize: 10,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                color: token.colorTextTertiary,
                                            }}
                                        >
                                            {currency.name}
                                        </Text>
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
                                            fontSize: 24,
                                            fontWeight: 800,
                                            letterSpacing: "-0.02em",
                                            color: token.colorText,
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        paddingTop: 12,
                                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                >
                                    <Flex justify="space-between" align="center">
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                color: token.colorTextQuaternary,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Latest Activity
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                color: token.colorTextQuaternary,
                                            }}
                                        >
                                            None
                                        </Text>
                                    </Flex>
                                    <Flex justify="space-between" align="center">
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                color: token.colorTextQuaternary,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Primary Acc.
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
                                    </Flex>
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
                                        height: 44,
                                        boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
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
