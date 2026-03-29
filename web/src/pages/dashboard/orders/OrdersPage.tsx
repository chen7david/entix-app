import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Typography } from "antd";
import type React from "react";

const { Title } = Typography;

export const OrdersPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6">
                <Title level={2}>Orders</Title>
                <p>Welcome to the Orders page.</p>
            </div>
        </>
    );
};
