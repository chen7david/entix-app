import { PlusOutlined } from "@ant-design/icons";
import type { WalletAccountDTO } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
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
        <div>
            <PageHeader
                title="Billing Oversight"
                subtitle="Centralized platform treasury management and organizational funding controls."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className="h-11 font-semibold transition-all duration-200"
                        onClick={() => {
                            setSelectedAccount(undefined);
                            setCreditDrawerOpen(true);
                        }}
                    >
                        Org Funding
                    </Button>
                }
            />

            {/* Treasury Health */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>
                        Platform Treasury
                    </Title>
                    <Tag
                        color="blue"
                        style={{
                            margin: 0,
                            borderRadius: 6,
                            fontWeight: 600,
                            borderColor: "#1e40af",
                            color: "#1e40af",
                        }}
                    >
                        LIQUIDITY
                    </Tag>
                </div>

                {isLoadingTreasury ? (
                    <Row gutter={[24, 24]}>
                        {[1, 2, 3, 4].map((i) => (
                            <Col xs={24} sm={12} lg={6} key={i}>
                                <Card loading />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Row gutter={[24, 24]}>
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
