import { LockOutlined, WalletOutlined } from "@ant-design/icons";
import type { WalletAccountDTO } from "@shared";
import { Card, Col, Flex, Grid, Row, Space, Statistic, Tag, Typography, theme } from "antd";
import type React from "react";

const { Text } = Typography;

type Props = {
    accounts: WalletAccountDTO[];
    loading?: boolean;
    onAccountClick: (account: WalletAccountDTO) => void;
};

export const OrgAccountCardGrid: React.FC<Props> = ({ accounts, loading, onAccountClick }) => {
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();

    if (loading && (!accounts || accounts.length === 0)) {
        return (
            <div className="py-20 text-center border border-dashed rounded-xl bg-slate-100/30">
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
                            style={{
                                borderRadius: 12,
                                transition: "all 0.2s ease-in-out",
                                background: token.colorBgContainer,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                            }}
                            onClick={() => onAccountClick(account)}
                            styles={{
                                body: {
                                    padding: screens.md ? "16px" : "12px",
                                },
                            }}
                        >
                            <Flex
                                justify="space-between"
                                align="center"
                                style={{ marginBottom: 16 }}
                            >
                                <Space align="center" size={8}>
                                    {isFunding ? (
                                        <LockOutlined
                                            style={{ color: token.colorPrimary, fontSize: 13 }}
                                        />
                                    ) : (
                                        <WalletOutlined
                                            style={{ color: token.colorTextTertiary, fontSize: 13 }}
                                        />
                                    )}
                                    <Text
                                        strong
                                        type="secondary"
                                        style={{
                                            fontSize: 9,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            color: token.colorTextQuaternary,
                                        }}
                                    >
                                        {isFunding ? "General Fund" : "Custom Account"}
                                    </Text>
                                </Space>
                                {isFunding && (
                                    <Tag
                                        color="blue"
                                        variant="filled"
                                        style={{
                                            margin: 0,
                                            fontSize: 9,
                                            fontWeight: 700,
                                            borderRadius: 4,
                                            padding: "0 6px",
                                        }}
                                    >
                                        DEFAULT
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
                                precision={2}
                                styles={{
                                    content: {
                                        fontSize: token.fontSizeXL,
                                        fontWeight: 700,
                                        color: token.colorText,
                                        letterSpacing: "-0.01em",
                                    },
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

                            <Flex
                                justify="space-between"
                                align="center"
                                style={{
                                    marginTop: 16,
                                    paddingTop: 12,
                                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
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
                            </Flex>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
};
