import React from 'react';
import { Typography } from 'antd';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

const { Title } = Typography;

export const LessonsPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-4xl mx-auto">
                <Title level={2}>Lessons</Title>
                <p>Welcome to the Lessons page.</p>
            </div>
        </>
    );
};
