import type { WalletAccountDTO } from "@shared";
import { AdminCreditDrawer } from "@web/src/features/wallet/components/AdminCreditDrawer";
import {
    FinancialAccountCard,
    type FinancialAccountData,
} from "@web/src/features/wallet/components/FinancialAccountCard";
import { useTreasuryBalance } from "@web/src/features/wallet/hooks/useTreasuryBalance";
import { Button, Card, Col, Row, Tag, Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title } = Typography;

export const FinancialManagementPage: React.FC = () => {
    const [selectedOrgId, setSelectedOrgId] = useState<string>();
    const [creditDrawerOpen, setCreditDrawerOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<WalletAccountDTO>();

    const { data: treasury, isLoading: isLoadingTreasury } = useTreasuryBalance();

    const handleCardClick = (account: FinancialAccountData) => {
        setSelectedAccount(account as WalletAccountDTO);
        setCreditDrawerOpen(true);
    };

    const handleOrgChange = (orgId: string) => {
        setSelectedOrgId(orgId);
    };

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 32,
                }}
            >
                <Title level={2} style={{ margin: 0 }}>
                    Financial Oversight
                </Title>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                        setSelectedAccount(undefined);
                        setCreditDrawerOpen(true);
                    }}
                >
                    + Org Funding
                </Button>
            </div>

            {/* Treasury Health */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>
                        Platform Treasury
                    </Title>
                    <Tag color="geekblue" bordered={false} style={{ margin: 0 }}>
                        LIQUIDITY
                    </Tag>
                </div>

                {isLoadingTreasury ? (
                    <Row gutter={[16, 16]}>
                        {[1, 2, 3, 4].map((i) => (
                            <Col xs={24} sm={12} lg={6} key={i}>
                                <Card loading />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Row gutter={[16, 16]}>
                        {treasury?.map((acc: WalletAccountDTO) => (
                            <Col xs={24} sm={12} lg={6} key={acc.id}>
                                <FinancialAccountCard
                                    account={acc}
                                    onClick={handleCardClick}
                                    accountState="active"
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <AdminCreditDrawer
                open={creditDrawerOpen}
                onClose={() => setCreditDrawerOpen(false)}
                organizationId={selectedOrgId}
                onOrgChange={handleOrgChange}
                preSelectedAccount={selectedAccount}
            />
        </div>
    );
};
