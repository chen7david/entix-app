import type { BillingPlanDTO } from "@shared/schemas/dto/billing-plan.dto";
import { useBillingPlans } from "@web/src/features/finance/hooks/useBillingPlans";
import { useMemberBilling } from "@web/src/features/finance/hooks/useMemberBilling";
import { useActivatedCurrencies } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { Card, Empty, Select, Skeleton, Space, Typography, theme } from "antd";
import type React from "react";

const { Text } = Typography;

interface BillingSelectorProps {
    orgId: string;
    userId: string;
    currency: { id: string; code: string; symbol: string };
    allPlans: BillingPlanDTO[];
}

const BillingSelector: React.FC<BillingSelectorProps> = ({ orgId, userId, currency, allPlans }) => {
    const { token } = theme.useToken();
    const {
        assignments,
        updatePlan,
        isLoading: loadingAssignments,
    } = useMemberBilling(orgId, userId);

    // Filter plans by currency
    const filteredPlans = allPlans.filter((p) => p.currencyId === currency.id);
    const currentAssignment = assignments?.find((a) => a.currencyId === currency.id);
    const selectedPlan = filteredPlans.find((p) => p.id === currentAssignment?.planId);

    if (loadingAssignments) return <Skeleton.Input active block style={{ height: 40 }} />;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Text strong>{currency.code} Billing Plan</Text>
            </div>

            <Select
                placeholder={`Select ${currency.code} Plan`}
                className="w-full"
                value={currentAssignment?.planId}
                loading={updatePlan.isPending}
                disabled={updatePlan.isPending}
                allowClear
                onChange={(planId) => {
                    if (planId) {
                        updatePlan.mutate({ planId, currencyId: currency.id });
                    }
                }}
            >
                {filteredPlans.map((plan) => (
                    <Select.Option key={plan.id} value={plan.id} disabled={!plan.isActive}>
                        <div className="flex justify-between items-center w-full">
                            <span>{plan.name}</span>
                            {!plan.isActive && (
                                <Text type="secondary" className="text-xs italic ml-2">
                                    (Inactive)
                                </Text>
                            )}
                        </div>
                    </Select.Option>
                ))}
            </Select>

            {/* Rate Tier Summary */}
            {selectedPlan && selectedPlan.rates && selectedPlan.rates.length > 0 && (
                <Card
                    size="small"
                    className="border-dashed"
                    style={{ backgroundColor: token.colorFillQuaternary }}
                >
                    <div className="flex flex-col gap-1 text-xs">
                        {selectedPlan.rates
                            .sort((a, b) => a.participantCount - b.participantCount)
                            .map((rate, idx, arr) => {
                                const nextRate = arr[idx + 1];
                                const rangeText = nextRate
                                    ? `${rate.participantCount}–${nextRate.participantCount - 1} students`
                                    : `${rate.participantCount}+ students`;

                                return (
                                    <div key={rate.id} className="flex justify-between">
                                        <Text type="secondary">{rangeText}:</Text>
                                        <Text strong>
                                            {currency.symbol}
                                            {(rate.rateCentsPerMinute / 100).toFixed(2)}/min
                                        </Text>
                                    </div>
                                );
                            })}
                    </div>
                </Card>
            )}
        </div>
    );
};

export const MemberBillingSection: React.FC<{ orgId: string; userId: string }> = ({
    orgId,
    userId,
}) => {
    const { currencies, isLoading: loadingCurrencies } = useActivatedCurrencies(orgId);
    const { data: planData, isLoading: loadingPlans } = useBillingPlans(orgId, { limit: 100 });

    if (loadingCurrencies || loadingPlans) {
        return (
            <Space direction="vertical" className="w-full" size="large">
                <Skeleton active />
            </Space>
        );
    }

    if (!currencies || currencies.length === 0) {
        return (
            <Empty
                description="No active currencies found. Activate a currency in the Finance dashboard to manage billing plans."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {currencies.map((currency) => (
                <BillingSelector
                    key={currency.id}
                    orgId={orgId}
                    userId={userId}
                    currency={currency}
                    allPlans={planData?.data || []}
                />
            ))}
        </div>
    );
};
