import type { FinancialAccountData } from "@web/src/features/wallet/components/FinancialAccountCard";
import { Col, Empty, Row, Typography } from "antd";
import type React from "react";
import type { CurrencyWithStatus } from "../hooks/useOrgCurrencies";
import { AvailableCurrencyCard } from "./AvailableCurrencyCard";

const { Text } = Typography;

type Props = {
    currencies: CurrencyWithStatus[];
    onActivate: (currencyId: string) => void;
    onAccountClick: (account: FinancialAccountData) => void;
    activating?: boolean;
};

export const CurrencyActivationGrid: React.FC<Props> = ({
    currencies,
    onActivate,
    onAccountClick,
    activating,
}) => {
    const toFinancialAccountData = (currency: CurrencyWithStatus): FinancialAccountData => ({
        id: currency.accountId ?? `account_${currency.id}`,
        name: currency.name,
        balanceCents: currency.balanceCents ?? 0,
        currencyId: currency.id,
        accountType: "funding", // Activated currencies are always General Funds
    });

    if (activating && currencies.length === 0) {
        return (
            <Row gutter={[16, 16]}>
                {[...Array(4)].map((_, i) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={`skeleton-${i}`}>
                        <AvailableCurrencyCard
                            currency={{} as any}
                            onActivate={() => {}}
                            loading={true}
                        />
                    </Col>
                ))}
            </Row>
        );
    }

    if (currencies.length === 0) {
        return (
            <div className="py-12 border border-dashed rounded-xl flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50">
                <Empty
                    description={
                        <Text type="secondary" className="text-xs">
                            No currencies available for this action.
                        </Text>
                    }
                />
            </div>
        );
    }

    return (
        <Row gutter={[16, 16]}>
            {currencies.map((currency) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={currency.id}>
                    <AvailableCurrencyCard
                        currency={currency}
                        onActivate={onActivate}
                        onClick={() => onAccountClick(toFinancialAccountData(currency))}
                        loading={activating}
                    />
                </Col>
            ))}
        </Row>
    );
};
