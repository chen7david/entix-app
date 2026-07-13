import { BankOutlined } from "@ant-design/icons";
import type { WalletAccountDTO } from "@shared";
import { TableEmptyState } from "@web/src/components/data/TableEmptyState";
import {
    FinancialAccountCard,
    type FinancialAccountData,
} from "@web/src/features/wallet/components/FinancialAccountCard";
import { Col, Row } from "antd";
import type React from "react";
import type { ReactNode } from "react";

type Props = {
    accounts: WalletAccountDTO[];
    loading?: boolean;
    onAccountClick?: (account: FinancialAccountData) => void;
    lowBalanceThresholdCents?: number;
    emptyAction?: ReactNode;
};

export const OrgAccountCardGrid: React.FC<Props> = ({
    accounts,
    loading,
    onAccountClick,
    lowBalanceThresholdCents,
    emptyAction,
}) => {
    if (loading && (!accounts || accounts.length === 0)) {
        return (
            <Row gutter={[16, 16]}>
                {[...Array(6)].map((_, i) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={`skeleton-${i}`}>
                        <FinancialAccountCard accountState="loading" account={{} as any} />
                    </Col>
                ))}
            </Row>
        );
    }

    if (!accounts || accounts.length === 0) {
        return (
            <TableEmptyState
                icon={<BankOutlined />}
                title="No accounts to show"
                subtitle="Activate a currency or create a custom account to get started."
                action={emptyAction}
            />
        );
    }

    return (
        <Row gutter={[16, 16]}>
            {accounts.map((account) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={account.id}>
                    <FinancialAccountCard
                        account={account}
                        onClick={onAccountClick}
                        accountState={account.isActive ? "active" : "available"}
                        lowBalanceThresholdCents={lowBalanceThresholdCents}
                    />
                </Col>
            ))}
        </Row>
    );
};
