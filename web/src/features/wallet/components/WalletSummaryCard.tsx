import { InfoCircleOutlined, WalletOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { Card, Col, Row, Statistic, Tooltip } from "antd";
import type { WalletAccount } from "../hooks/useWalletBalance";

type WalletSummaryCardProps = {
    accounts?: WalletAccount[];
    loading?: boolean;
};

export const WalletSummaryCard = ({ accounts, loading }: WalletSummaryCardProps) => {
    return (
        <Card
            title={
                <span>
                    <WalletOutlined /> Wallet Summary
                </span>
            }
            loading={loading}
        >
            <Row gutter={[24, 24]}>
                {accounts?.map((acc) => {
                    const config =
                        FINANCIAL_CURRENCY_CONFIG[
                            acc.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                        ];

                    return (
                        <Col xs={24} sm={12} md={8} lg={6} key={acc.id}>
                            <Statistic
                                title={
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontWeight: 500 }}>{acc.name}</span>
                                        <Tooltip title={acc.isActive ? "Active" : "Inactive"}>
                                            <InfoCircleOutlined
                                                style={{
                                                    color: acc.isActive ? "#52c41a" : "#faad14",
                                                    fontSize: 12,
                                                }}
                                            />
                                        </Tooltip>
                                    </div>
                                }
                                value={acc.balanceCents / 100}
                                precision={2}
                                prefix={config?.symbol ?? ""}
                                suffix={config?.code ?? ""}
                                valueStyle={{ fontSize: 20 }}
                            />
                        </Col>
                    );
                })}
                {!accounts?.length && !loading && (
                    <Col span={24}>
                        <div style={{ color: "#8c8c8c", textAlign: "center", padding: "20px 0" }}>
                            No active accounts found
                        </div>
                    </Col>
                )}
            </Row>
        </Card>
    );
};
