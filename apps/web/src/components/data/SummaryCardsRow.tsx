import { Card, Col, Row, Statistic, theme } from "antd";
import type React from "react";

export interface SummaryCardItem {
    key: string;
    label: string;
    value: number | string;
    icon?: React.ReactNode;
    /** Prefer omitting and letting the theme primary apply, or pass a token color. */
    color?: string;
    suffix?: React.ReactNode;
}

interface SummaryCardsRowProps {
    items: SummaryCardItem[];
    loading?: boolean;
}

export const SummaryCardsRow: React.FC<SummaryCardsRowProps> = ({ items, loading }) => {
    const { token } = theme.useToken();

    if (!items || items.length === 0) return null;

    const lgSpan = 24 / Math.min(Math.max(items.length, 1), 4);

    return (
        <Row gutter={[16, 16]} className="mb-8">
            {items.map((item) => (
                <Col xs={24} sm={12} md={8} lg={lgSpan} key={item.key}>
                    <Card
                        bordered={false}
                        loading={loading}
                        className="h-full shadow-sm"
                        styles={{
                            body: { background: token.colorBgContainer },
                        }}
                    >
                        <Statistic
                            title={
                                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                                    {item.label}
                                </span>
                            }
                            value={item.value}
                            prefix={
                                item.icon ? (
                                    <span
                                        style={{
                                            color: item.color ?? token.colorPrimary,
                                            marginRight: 8,
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                ) : null
                            }
                            suffix={item.suffix}
                            valueStyle={{ fontWeight: 600 }}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};
