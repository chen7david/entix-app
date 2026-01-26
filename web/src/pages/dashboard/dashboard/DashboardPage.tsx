import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';

const { Title } = Typography;

export const DashboardPage: React.FC = () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    // This throws during RENDERING, which error boundary CAN catch
    if (shouldThrow) {
        throw new Error('Test error thrown by DashboardPage - This is intentional for testing!');
    }

    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-4xl mx-auto">
                <Title level={2}>Dashboard</Title>
                {/* Set state to trigger re-render with error */}
                <Button danger onClick={() => setShouldThrow(true)}>
                    🧪 Test Error Boundary
                </Button>
                <p>Welcome to the Dashboard page.</p>
            </div>
        </>
    );
};
