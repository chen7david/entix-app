import { Typography } from "antd";
import type React from "react";

const { Title, Paragraph } = Typography;

export const OrdersPage: React.FC = () => {
    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Orders
                </Title>
                <Paragraph type="secondary">View and track your order history.</Paragraph>
            </div>
        </div>
    );
};
