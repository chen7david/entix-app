import { Typography } from "antd";
import type React from "react";

const { Title, Paragraph } = Typography;

export const ShopPage: React.FC = () => {
    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Shop
                </Title>
                <Paragraph type="secondary">
                    Explore and purchase digital products and services.
                </Paragraph>
            </div>
        </div>
    );
};
