import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Typography } from "antd";
import type React from "react";

const { Title, Paragraph } = Typography;

export const ShopPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6">
                <Title level={2}>Shop</Title>
                <Paragraph>Welcome to the Shop page.</Paragraph>
            </div>
        </>
    );
};
