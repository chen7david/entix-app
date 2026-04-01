import { CheckCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Badge, Button, Card, Col, Row, Statistic, Tag, Typography, theme } from "antd";
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
        <Row gutter={[16, 16]}>
            {currencies.map((currency) => (
                <Col xs={24} sm={12} md={6} key={currency.id}>
                    <Card
                        size="small"
                        style={{
                            height: "100%",
                            borderStyle: currency.isActivated ? "solid" : "dashed",
                        }}
                        styles={{
                            body: {
                                background: currency.isActivated
                                    ? undefined
                                    : token.colorFillTertiary,
                            },
                            actions: {
                                background: currency.isActivated
                                    ? undefined
                                    : token.colorFillTertiary,
                                borderTop: "none",
                            },
                        }}
                        actions={
                            currency.isActivated
                                ? [
                                      <Badge
                                          key="status"
                                          status={currency.isActivated ? "success" : "default"}
                                          text={
                                              <Text
                                                  type={
                                                      currency.isActivated ? undefined : "secondary"
                                                  }
                                                  style={{ fontSize: 13 }}
                                              >
                                                  {currency.isActivated ? "Active" : "Deactivated"}
                                              </Text>
                                          }
                                      />,
                                  ]
                                : [
                                      <Button
                                          key="activate"
                                          type="primary"
                                          size="middle"
                                          icon={<PlusOutlined />}
                                          loading={activating}
                                          onClick={() => onActivate(currency.id)}
                                          block
                                      >
                                          Activate
                                      </Button>,
                                  ]
                        }
                    >
                        {currency.isActivated ? (
                            <Statistic
                                title={
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                            marginBottom: 4,
                                        }}
                                    >
                                        <Text strong style={{ fontSize: 13 }}>
                                            {currency.name}
                                        </Text>
                                        <Tag
                                            color="success"
                                            bordered={false}
                                            icon={<CheckCircleOutlined />}
                                            style={{ margin: 0, fontSize: 10 }}
                                        >
                                            Active
                                        </Tag>
                                    </div>
                                }
                                value={(currency.balanceCents ?? 0) / 100}
                                precision={2}
                                prefix={
                                    <Text type="secondary" style={{ marginRight: 4 }}>
                                        {currency.symbol}
                                    </Text>
                                }
                                suffix={
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {currency.code}
                                    </Text>
                                }
                                valueStyle={{ fontSize: 24, fontWeight: 700 }}
                            />
                        ) : (
                            <div style={{ textAlign: "center", padding: "16px 0" }}>
                                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>
                                    {currency.symbol}
                                </div>
                                <Text strong style={{ fontSize: 16 }}>
                                    {currency.code}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {currency.name}
                                </Text>
                            </div>
                        )}
                    </Card>
                </Col>
            ))}
        </Row>
    );
};
