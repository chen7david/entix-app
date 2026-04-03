import type { WalletAccountDTO } from "@shared";
import { FinancialAccountCard } from "@web/src/features/wallet/components/FinancialAccountCard";
import { Col, Row, Typography } from "antd";
import type React from "react";

const { Text } = Typography;

type Props = {
    accounts: WalletAccountDTO[];
    loading?: boolean;
    onAccountClick: (account: WalletAccountDTO) => void;
};

export const OrgAccountCardGrid: React.FC<Props> = ({ accounts, loading, onAccountClick }) => {
    if (loading && (!accounts || accounts.length === 0)) {
        return (
            <div className="py-20 text-center border border-dashed rounded-xl bg-slate-100/30">
                <Text type="secondary">Loading treasury accounts...</Text>
            </div>
        );
    }

    return (
        <Row gutter={[16, 16]}>
            {accounts.map((account) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={account.id}>
                    <FinancialAccountCard
                        account={account}
                        onClick={onAccountClick}
                        isPrimaryBranding={true}
                    />
                </Col>
            ))}
        </Row>
    );
};
