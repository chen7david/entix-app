import { InfoCircleOutlined, WalletOutlined } from "@ant-design/icons";
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
            <Row gutter={24}>
                {accounts?.map((acc) => (
                    <Col span={12} key={acc.id}>
                        <Statistic
                            title={
                                <span>
                                    {acc.name}{" "}
                                    <Tooltip title={acc.isActive ? "Active" : "Inactive"}>
                                        <InfoCircleOutlined
                                            style={{ color: acc.isActive ? "#52c41a" : "#faad14" }}
                                        />
                                    </Tooltip>
                                </span>
                            }
                            value={acc.balanceCents / 100}
                            precision={2}
                            prefix={acc.currencyId.includes("usd") ? "$" : "E$"}
                            suffix={acc.currencyId.split("_")[1].toUpperCase()}
                        />
                    </Col>
                ))}
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
