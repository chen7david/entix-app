import React from 'react';
import { Typography } from 'antd';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

const { Title } = Typography;

export const ShopPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6">
                <Title level={2}>Shop</Title>
                <p>Welcome to the Shop page.</p>
            </div>
        </>
    );
};
