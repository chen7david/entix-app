import { CheckCircleOutlined, LockOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography, theme } from "antd";
import type React from "react";
import type { WalletAccount } from "../../wallet/hooks/useWalletBalance";

const { Text } = Typography;

type Props = {
    accounts: WalletAccount[];
    loading?: boolean;
    onCreditClick: (account: WalletAccount) => void;
    onTransferClick?: (account: WalletAccount) => void;
};

export const OrgAccountCardGrid: React.FC<Props> = ({
    accounts,
    loading,
    onCreditClick,
    onTransferClick,
}) => {
    const { token } = theme.useToken();

    if (loading && (!accounts || accounts.length === 0)) {
        return (
            <div className="py-20 text-center">
                <Text type="secondary">Loading treasury accounts...</Text>
            </div>
        );
    }

    return (
        <Row gutter={[16, 16]}>
            {accounts.map((account) => {
                const isFunding = account.isFundingAccount;
                return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={account.id}>
                        <Card
                            hoverable
                            variant="borderless"
                            styles={{
                                body: {
                                    padding: "20px",
                                },
                            }}
                            actions={[
                                isFunding ? (
                                    <Button
                                        key="credit"
                                        type="link"
                                        size="small"
                                        block
                                        onClick={() => onCreditClick(account)}
                                        style={{ fontSize: 11, fontWeight: 600 }}
                                    >
                                        ADMIN CREDIT
                                    </Button>
                                ) : (
                                    <Button
                                        key="transfer"
                                        type="link"
                                        size="small"
                                        block
                                        onClick={() => onTransferClick?.(account)}
                                        style={{ fontSize: 11, fontWeight: 600 }}
                                    >
                                        INTERNAL TRANSFER
                                    </Button>
                                ),
                            ]}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: 12,
                                }}
                            >
                                <Space align="center" size={8}>
                                    {isFunding ? (
                                        <LockOutlined
                                            style={{ color: token.colorPrimary, fontSize: 14 }}
                                        />
                                    ) : (
                                        <WalletOutlined
                                            style={{ color: token.colorTextTertiary, fontSize: 14 }}
                                        />
                                    )}
                                    <Text
                                        strong
                                        type="secondary"
                                        style={{
                                            fontSize: 10,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        {isFunding ? "General Fund" : "Custom Account"}
                                    </Text>
                                </Space>
                                {isFunding && (
                                    <Tag color="blue-inverse" style={{ fontSize: 9, margin: 0 }}>
                                        FUNDING
                                    </Tag>
                                )}
                            </div>

                            <Statistic
                                title={
                                    <Text
                                        strong
                                        style={{ fontSize: 16, display: "block", marginBottom: 8 }}
                                        title={account.name}
                                    >
                                        {account.name}
                                    </Text>
                                }
                                value={account.balanceCents / 100}
                                precision={2}
                                valueStyle={{
                                    fontSize: "1.5rem",
                                    fontWeight: 700,
                                    color: token.colorText,
                                }}
                                suffix={
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            marginLeft: 4,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {account.currencyId.split("_").pop()}
                                    </Text>
                                }
                            />

                            <div
                                style={{
                                    marginTop: 16,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Tag
                                    color="success"
                                    icon={<CheckCircleOutlined />}
                                    style={{ fontSize: 10, margin: 0, borderRadius: 4 }}
                                >
                                    ACTIVE
                                </Tag>
                                <Text
                                    style={{ fontSize: 10, opacity: 0.3, fontFamily: "monospace" }}
                                >
                                    {account.id.split("_").pop()?.slice(0, 8).toUpperCase()}
                                </Text>
                            </div>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
};
