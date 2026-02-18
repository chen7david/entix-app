import React from 'react';
import { Typography } from 'antd';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

const { Title } = Typography;

export const HomePage: React.FC = () => {


    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-4xl mx-auto">
                <Title level={2}>Home</Title>
                <p>Welcome to the Home page.</p>
            </div>
        </>
    );
};
