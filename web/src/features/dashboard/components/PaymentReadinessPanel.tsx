import { AppRoutes } from "@shared";
import { useQueryClient } from "@tanstack/react-query";
import { useBillingPlans } from "@web/src/features/finance/hooks/useBillingPlans";
import { useMemberBilling } from "@web/src/features/finance/hooks/useMemberBilling";
import { useActivatedCurrencies } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { useOrganization } from "@web/src/features/organization";
import { useOrgNavigate } from "@web/src/features/organization/hooks/useOrgNavigate";
import { useInitializeWallet } from "@web/src/features/wallet/hooks/useInitializeWallet";
import { Alert, Avatar, Button, Card, Drawer, List, Select, Space, Tag, Typography } from "antd";
import type React from "react";
import { useMemo, useState } from "react";

type Props = {
    paymentReadiness?: {
        totalStudents: number;
        missingWalletCount: number;
        missingBillingPlanCount: number;
        missingBothCount: number;
        membersNeedingSetup: {
            userId: string;
            name: string;
            role: string;
            avatarUrl?: string | null;
            hasWallet: boolean;
            hasBillingPlan: boolean;
        }[];
    };
};

const { Text } = Typography;

type ReadinessMember = {
    userId: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
    hasWallet: boolean;
    hasBillingPlan: boolean;
};

const MemberSetupDrawer: React.FC<{
    member: ReadinessMember | null;
    onClose: () => void;
}> = ({ member, onClose }) => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const initializeWallet = useInitializeWallet(orgId || "");
    const { assignments, updatePlan } = useMemberBilling(orgId || "", member?.userId || "");
    const { data: planData } = useBillingPlans(orgId || "", { limit: 100 });
    const { currencies } = useActivatedCurrencies(orgId || "");

    const plansByCurrency = useMemo(() => {
        const map = new Map<string, { label: string; value: string; disabled?: boolean }[]>();
        for (const currency of currencies || []) {
            map.set(
                currency.id,
                (planData?.data || [])
                    .filter((plan) => plan.currencyId === currency.id)
                    .map((plan) => ({
                        label: `${plan.name}${plan.isActive ? "" : " (Inactive)"}`,
                        value: plan.id,
                        disabled: !plan.isActive,
                    }))
            );
        }
        return map;
    }, [currencies, planData?.data]);

    const handleInitializeWallet = async () => {
        if (!member) return;
        await initializeWallet.mutateAsync(member.userId);
        await queryClient.invalidateQueries({ queryKey: ["bulkMetrics", orgId] });
    };

    const handleAssignPlan = async (planId: string, currencyId: string) => {
        await updatePlan.mutateAsync({ planId, currencyId });
        await queryClient.invalidateQueries({ queryKey: ["bulkMetrics", orgId] });
    };

    return (
        <Drawer
            title={member ? `Resolve member issues: ${member.name}` : "Resolve member issues"}
            open={!!member}
            onClose={onClose}
            width={460}
            destroyOnClose
        >
            {member && (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Space align="center">
                        <Avatar src={member.avatarUrl || undefined} size={40}>
                            {member.name?.[0]?.toUpperCase() || "M"}
                        </Avatar>
                        <Space direction="vertical" size={0}>
                            <Text strong>{member.name}</Text>
                            <Text type="secondary">{member.role}</Text>
                        </Space>
                    </Space>
                    <Card size="small">
                        <Space direction="vertical" size="small" style={{ width: "100%" }}>
                            <Text strong>Wallet setup</Text>
                            <Text type="secondary">
                                Required so session payments can post transactions.
                            </Text>
                            <Button
                                type={member.hasWallet ? "default" : "primary"}
                                onClick={handleInitializeWallet}
                                loading={initializeWallet.isPending}
                                disabled={member.hasWallet}
                            >
                                {member.hasWallet ? "Wallet already active" : "Activate wallet"}
                            </Button>
                        </Space>
                    </Card>

                    <Card size="small">
                        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                            <Text strong>Billing plan setup</Text>
                            <Text type="secondary">
                                Assign one plan per active currency for this member.
                            </Text>
                            {(currencies || []).map((currency) => {
                                const current = assignments?.find(
                                    (assignment) => assignment.currencyId === currency.id
                                );
                                return (
                                    <Space
                                        key={currency.id}
                                        direction="vertical"
                                        size={6}
                                        style={{ width: "100%" }}
                                    >
                                        <Text>{currency.code}</Text>
                                        <Select
                                            placeholder={`Select ${currency.code} plan`}
                                            options={plansByCurrency.get(currency.id) || []}
                                            value={current?.planId}
                                            onChange={(planId) =>
                                                handleAssignPlan(planId, currency.id)
                                            }
                                            loading={updatePlan.isPending}
                                            showSearch
                                            allowClear={false}
                                        />
                                    </Space>
                                );
                            })}
                        </Space>
                    </Card>
                </Space>
            )}
        </Drawer>
    );
};

export const PaymentReadinessPanel: React.FC<Props> = ({ paymentReadiness }) => {
    const navigateOrg = useOrgNavigate();
    const [selectedMember, setSelectedMember] = useState<ReadinessMember | null>(null);

    if (!paymentReadiness) return null;

    const needsSetup = paymentReadiness.membersNeedingSetup;
    const preview = needsSetup.slice(0, 8);

    return (
        <Card title="Member Setup Issues" className="rounded-xl">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Alert
                    type={needsSetup.length > 0 ? "warning" : "success"}
                    showIcon
                    message={
                        needsSetup.length > 0
                            ? `${needsSetup.length} member${needsSetup.length === 1 ? "" : "s"} need setup attention before automated billing can run smoothly.`
                            : "No member setup issues detected."
                    }
                    description={
                        <Space wrap>
                            <Tag color="gold">
                                Missing wallet: {paymentReadiness.missingWalletCount}
                            </Tag>
                            <Tag color="purple">
                                Missing billing plan: {paymentReadiness.missingBillingPlanCount}
                            </Tag>
                            <Tag color="red">Missing both: {paymentReadiness.missingBothCount}</Tag>
                        </Space>
                    }
                />

                {preview.length > 0 && (
                    <List
                        size="small"
                        bordered
                        dataSource={preview}
                        renderItem={(member) => (
                            <List.Item>
                                <Space
                                    align="center"
                                    style={{ width: "100%", justifyContent: "space-between" }}
                                >
                                    <Space align="center" size={10}>
                                        <Avatar src={member.avatarUrl || undefined}>
                                            {member.name?.[0]?.toUpperCase() || "M"}
                                        </Avatar>
                                        <Space direction="vertical" size={2}>
                                            <Text strong>{member.name}</Text>
                                            <Space size={6}>
                                                {!member.hasWallet && (
                                                    <Tag color="gold">Wallet missing</Tag>
                                                )}
                                                {!member.hasBillingPlan && (
                                                    <Tag color="purple">Billing plan missing</Tag>
                                                )}
                                            </Space>
                                        </Space>
                                    </Space>
                                    <Button size="small" onClick={() => setSelectedMember(member)}>
                                        Resolve
                                    </Button>
                                </Space>
                            </List.Item>
                        )}
                    />
                )}

                <Space wrap>
                    <Button onClick={() => navigateOrg(AppRoutes.org.admin.members)}>
                        Open Members
                    </Button>
                    <Button onClick={() => navigateOrg(AppRoutes.org.admin.billing.accounts)}>
                        Open Billing Accounts
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => navigateOrg(AppRoutes.org.admin.billing.plans)}
                    >
                        Open Billing Plans
                    </Button>
                </Space>
            </Space>
            <MemberSetupDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
        </Card>
    );
};
