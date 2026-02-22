import React from 'react';
import { Typography } from 'antd';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

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
