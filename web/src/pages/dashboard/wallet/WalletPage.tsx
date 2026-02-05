import React from 'react';
import { Tabs, Typography } from 'antd';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { WalletOverview } from '@web/src/components/finance/WalletOverview';
import { TransferForm } from '@web/src/components/finance/TransferForm';
import { TransactionHistory } from '@web/src/components/finance/TransactionHistory';

const { Title } = Typography;

export const WalletPage: React.FC = () => {
    const items = [
        {
            key: 'overview',
            label: 'Overview',
            children: <WalletOverview />,
        },
        {
            key: 'transfer',
            label: 'Transfer',
            children: <TransferForm />,
        },
        {
            key: 'history',
            label: 'History',
            children: <TransactionHistory />,
        }
    ];

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Toolbar />
            <div style={{ padding: 24, flex: 1, overflow: 'auto' }}>
                <Title level={2}>Wallet</Title>
                <Tabs defaultActiveKey="overview" items={items} destroyInactiveTabPane={true} />
            </div>
        </div>
    );
};
