import { CheckCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Statistic, Tag, Typography } from "antd";
import type React from "react";
import type { CurrencyWithStatus } from "../hooks/useOrgCurrencies";

const { Text } = Typography;

type Props = {
    currencies: CurrencyWithStatus[];
    onActivate: (currencyId: string) => void;
    activating?: boolean;
};

export const CurrencyActivationGrid: React.FC<Props> = ({ currencies, onActivate, activating }) => (
    <Row gutter={[16, 16]}>
        {currencies.map((currency) => (
            <Col xs={24} sm={12} md={6} key={currency.id}>
                <Card
                    bordered
                    style={{
                        opacity: currency.isActivated ? 1 : 0.6,
                        borderStyle: currency.isActivated ? "solid" : "dashed",
                    }}
                    actions={
                        currency.isActivated
                            ? undefined
                            : [
                                  <Button
                                      key="activate"
                                      type="primary"
                                      size="small"
                                      icon={<PlusOutlined />}
                                      loading={activating}
                                      onClick={() => onActivate(currency.id)}
                                  >
                                      Activate
                                  </Button>,
                              ]
                    }
                >
                    {currency.isActivated ? (
                        <Statistic
                            title={
                                <span>
                                    {currency.name}{" "}
                                    <Tag color="green" icon={<CheckCircleOutlined />}>
                                        Active
                                    </Tag>
                                </span>
                            }
                            value={(currency.balanceCents ?? 0) / 100}
                            precision={2}
                            prefix={currency.symbol}
                            suffix={currency.code}
                        />
                    ) : (
                        <div style={{ textAlign: "center", padding: "12px 0" }}>
                            <Text style={{ fontSize: 24 }}>{currency.symbol}</Text>
                            <br />
                            <Text strong>{currency.code}</Text>
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
