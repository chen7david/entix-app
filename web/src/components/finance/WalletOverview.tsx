import React from 'react';
import { Card, Statistic, Row, Col, Spin, Empty, Button } from 'antd';
import { useBalance } from '@web/src/hooks/finance/useFinance';
import { PinManagement } from './PinManagement';
import { useState } from 'react';

export const WalletOverview: React.FC = () => {
    const { data: accounts, isLoading, error } = useBalance();
    const [pinVisible, setPinVisible] = useState(false);

    if (isLoading) return <Spin />;
    if (error) return <Empty description="Failed to load balance" />;

    return (
        <div>
            <Row gutter={[16, 16]}>
                {accounts?.map((account) => (
                    <Col span={8} key={account.currency}>
                        <Card>
                            <Statistic
                                title={`Balance (${account.currency})`}
                                value={account.balance / 100} // Convert cents to units
                                precision={2}
                                prefix={account.currency === 'CNY' ? '¥' : 'ETP'}
                            />
                            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                                Code: {account.code || 'N/A'}
                            </div>
                        </Card>
                    </Col>
                ))}
                {(!accounts || accounts.length === 0) && (
                    <Col span={24}>
                        <Empty description="No accounts found" />
                    </Col>
                )}
            </Row>
            <div style={{ marginTop: 16 }}>
                <Button onClick={() => setPinVisible(true)}>Manage PIN</Button>
                <PinManagement visible={pinVisible} onClose={() => setPinVisible(false)} />
            </div>
        </div>
    );
};
