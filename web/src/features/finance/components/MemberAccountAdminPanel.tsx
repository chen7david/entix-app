import { ArrowDownOutlined, ArrowUpOutlined, WalletOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { POSInput } from "@web/src/components/ui/POSInput";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";
import { FINANCIAL_ADJUSTMENT_REASONS } from "@web/src/utils/constants";
import { Alert, Button, Divider, Form, Input, Radio, Select, Skeleton, Space } from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useAdminAdjustWallet } from "../hooks/useAdminAdjustWallet";

const DEFAULT_REASON = FINANCIAL_ADJUSTMENT_REASONS[0];

type Props = {
    memberId: string;
    orgId: string;
    memberName: string;
};

export const MemberAccountAdminPanel: React.FC<Props> = ({ memberId, orgId, memberName }) => {
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [reasonType, setReasonType] = useState<string>(DEFAULT_REASON);
    const [form] = Form.useForm();

    const { data: balanceData, isLoading: isLoadingMember } = useWalletBalance(
        memberId,
        "user",
        orgId
    );
    const { data: orgBalanceData, isLoading: isLoadingOrg } = useWalletBalance(orgId, "org");
    const { mutate: adjust, isPending } = useAdminAdjustWallet(orgId);

    const accounts = balanceData?.accounts || [];
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

    const orgAccounts = orgBalanceData?.accounts || [];
    const orgFundingAccount = orgAccounts.find(
        (a) => a.currencyId === selectedAccount?.currencyId && a.accountType === "funding"
    );

    const isLoading = isLoadingMember || isLoadingOrg;

    // Reset selected account when member changes to avoid stale context
    useEffect(() => {
        setSelectedAccountId(null);
    }, []);

    // Resolve meta for display
    const selectedCurrencyMeta = selectedAccount
        ? FINANCIAL_CURRENCY_CONFIG[
              selectedAccount.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
          ]
        : null;

    // Auto-select funding account by default
    useEffect(() => {
        if (!selectedAccountId && accounts.length > 0) {
            const fundingAccount = accounts.find((a) => a.accountType === "funding");
            if (fundingAccount) {
                setSelectedAccountId(fundingAccount.id);
            } else {
                setSelectedAccountId(accounts[0].id);
            }
        }
    }, [accounts, selectedAccountId]);

    // Sync reason selection with form when specialized
    const handleReasonChange = (value: string) => {
        setReasonType(value);
        if (value !== "Other") {
            form.setFieldsValue({ description: value });
        } else {
            form.setFieldsValue({ description: "" });
        }
    };

    const onFinish = (values: any) => {
        if (!selectedAccountId || !selectedAccount || !orgFundingAccount) return;

        const finalDescription =
            values.reasonSelect === "Other" ? values.description : values.reasonSelect;

        adjust(
            {
                organizationId: orgId,
                accountId: selectedAccountId,
                // The 'platformTreasuryAccountId' field is repurposed here to mean the 'Org Funding Account'
                // This ensures the ledger maintains a clear Org -> Member internal transfer audit trail.
                platformTreasuryAccountId: orgFundingAccount.id,
                amountCents: Math.round(values.amount * 100),
                currencyId: selectedAccount.currencyId,
                description: finalDescription || `Admin ${values.type} by ${memberName}`,
                type: values.type,
            },
            {
                onSuccess: () => {
                    form.resetFields();
                    setReasonType(DEFAULT_REASON);
                    form.setFieldsValue({ reasonSelect: DEFAULT_REASON });
                },
            }
        );
    };

    // Build Dropdown Options with inline balances for administrative context
    const walletOptions = accounts.map((account) => {
        const meta =
            FINANCIAL_CURRENCY_CONFIG[account.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];
        const balance = (account.balanceCents / 100).toFixed(2);
        const label = `${meta?.code || account.currencyId} Wallet — ${meta?.symbol || "$"}${balance}`;
        return { label, value: account.id };
    });

    if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
                type: "credit",
                amount: 0,
                reasonSelect: DEFAULT_REASON,
            }}
            style={{ padding: "8px 0" }}
        >
            <Form.Item
                label="Select Member Wallet"
                tooltip="The specific currency wallet to be adjusted"
            >
                <Select
                    size="large"
                    placeholder="Select a wallet..."
                    value={selectedAccountId}
                    onChange={(val) => setSelectedAccountId(val)}
                    options={walletOptions}
                    style={{ width: "100%", height: 48 }}
                    suffixIcon={<WalletOutlined />}
                />
            </Form.Item>

            {selectedAccount && (
                <>
                    <Divider
                        style={{
                            marginTop: 8,
                            marginBottom: 24,
                            borderStyle: "dashed",
                            opacity: 0.6,
                        }}
                    />

                    <Form.Item name="type" label="Adjustment Type" rules={[{ required: true }]}>
                        <Radio.Group style={{ width: "100%", display: "flex" }}>
                            <Radio.Button
                                value="credit"
                                style={{
                                    flex: 1,
                                    textAlign: "center",
                                    height: 48,
                                    lineHeight: "46px",
                                }}
                            >
                                <Space>
                                    <ArrowUpOutlined
                                        style={{ color: "var(--ant-color-success)" }}
                                    />{" "}
                                    CREDIT
                                </Space>
                            </Radio.Button>
                            <Radio.Button
                                value="debit"
                                style={{
                                    flex: 1,
                                    textAlign: "center",
                                    height: 48,
                                    lineHeight: "46px",
                                }}
                            >
                                <Space>
                                    <ArrowDownOutlined
                                        style={{ color: "var(--ant-color-error)" }}
                                    />{" "}
                                    DEBIT
                                </Space>
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        name="amount"
                        label="Adjustment Amount"
                        rules={[{ required: true, type: "number", min: 0.01 }]}
                    >
                        <POSInput prefix={selectedCurrencyMeta?.symbol} placeholder="0.00" />
                    </Form.Item>

                    <Form.Item
                        name="reasonSelect"
                        label="Adjustment Reason"
                        rules={[{ required: true }]}
                    >
                        <Select size="large" onChange={handleReasonChange} style={{ height: 48 }}>
                            {FINANCIAL_ADJUSTMENT_REASONS.map((r) => (
                                <Select.Option key={r} value={r}>
                                    {r}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {reasonType === "Other" && (
                        <Form.Item
                            name="description"
                            label="Custom Adjustment Note"
                            rules={[{ required: true, message: "Please provide a reason" }]}
                        >
                            <Input.TextArea
                                placeholder="E.g., Reimbursement for excessive usage, correction of credit error..."
                                rows={3}
                            />
                        </Form.Item>
                    )}

                    {!orgFundingAccount && !isLoading && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Action Restricted"
                            description={
                                <span>
                                    This organization has no <b>General Fund</b> account for{" "}
                                    <b>
                                        {selectedCurrencyMeta?.code || selectedAccount.currencyId}
                                    </b>
                                    . You must first fund the organization's{" "}
                                    {selectedCurrencyMeta?.code || "USD"} wallet before crediting
                                    members.
                                </span>
                            }
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    <div style={{ marginTop: 24 }}>
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isPending}
                                disabled={!orgFundingAccount}
                                size="large"
                                style={{ fontWeight: 600, width: "100%" }}
                            >
                                Execute Adjustment
                            </Button>
                        </Space>
                    </div>
                </>
            )}
        </Form>
    );
};
