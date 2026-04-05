import { Card, Col, Row, Statistic } from "antd";
import type React from "react";

export interface SummaryCardItem {
    key: string;
    label: string;
    value: number | string;
    icon?: React.ReactNode;
    color?: string;
    suffix?: React.ReactNode;
}

interface SummaryCardsRowProps {
    items: SummaryCardItem[];
    loading?: boolean;
}

export const SummaryCardsRow: React.FC<SummaryCardsRowProps> = ({ items, loading }) => {
    if (!items || items.length === 0) return null;

    // Limit to max 4 items per row layout, or scale appropriately
    const lgSpan = 24 / Math.min(Math.max(items.length, 1), 4);

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            {items.map((item) => (
                <Col xs={24} sm={12} md={8} lg={lgSpan} key={item.key}>
                    <Card
                        bordered={false}
                        loading={loading}
                        style={{ height: "100%", background: "var(--ant-color-bg-container)" }}
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
                                    <span style={{ color: item.color, marginRight: 8 }}>
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
