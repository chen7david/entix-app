import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    InfoCircleOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    Radio,
    Row,
    Select,
    Skeleton,
    Space,
    Statistic,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useAdminAdjustWallet } from "../hooks/useAdminAdjustWallet";

const { Title, Text, Paragraph } = Typography;

const COMMON_REASONS = [
    "Promotional Credit",
    "Usage Reimbursement",
    "Account Correction",
    "Service Refund",
    "Goodwill Credit",
    "Manual Adjustment",
    "Other",
];

type Props = {
    memberId: string;
    orgId: string;
    memberName: string;
};

export const MemberAccountAdminPanel: React.FC<Props> = ({ memberId, orgId, memberName }) => {
    const { token } = theme.useToken();
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [reasonType, setReasonType] = useState<string>("Manual Adjustment");
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
        (a) => a.currencyId === selectedAccount?.currencyId && a.isFundingAccount
    );

    const isLoading = isLoadingMember || isLoadingOrg;

    // Resolve meta for display
    const selectedCurrencyMeta = selectedAccount
        ? FINANCIAL_CURRENCY_CONFIG[
              selectedAccount.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
          ]
        : null;

    // Auto-select funding account by default
    useEffect(() => {
        if (!selectedAccountId && accounts.length > 0) {
            const fundingAccount = accounts.find((a) => a.isFundingAccount);
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
                    setReasonType("Manual Adjustment");
                    form.setFieldsValue({ reasonSelect: "Manual Adjustment" });
                },
            }
        );
    };

    if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Row gutter={[16, 16]}>
                {accounts.map((account) => {
                    const isSelected = selectedAccountId === account.id;
                    const meta =
                        FINANCIAL_CURRENCY_CONFIG[
                            account.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                        ];
                    return (
                        <Col xs={24} sm={12} lg={8} key={account.id}>
                            <Card
                                hoverable
                                size="small"
                                onClick={() => setSelectedAccountId(account.id)}
                                style={{
                                    cursor: "pointer",
                                    border: isSelected
                                        ? `2px solid ${token.colorPrimary}`
                                        : undefined,
                                    background: isSelected
                                        ? "var(--ant-color-primary-bg)"
                                        : undefined,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 8,
                                    }}
                                >
                                    <Text
                                        strong
                                        type="secondary"
                                        style={{
                                            fontSize: 10,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                        }}
                                    >
                                        {meta?.code || account.currencyId}
                                    </Text>
                                    <WalletOutlined
                                        style={{
                                            color: isSelected
                                                ? token.colorPrimary
                                                : token.colorTextQuaternary,
                                        }}
                                    />
                                </div>
                                <Statistic
                                    value={account.balanceCents / 100}
                                    precision={2}
                                    valueStyle={{
                                        fontSize: token.fontSizeXL,
                                        fontWeight: 600,
                                        marginTop: -4,
                                    }}
                                    suffix={
                                        <Text type="secondary" style={{ fontSize: 14 }}>
                                            {meta?.symbol || "$"}
                                        </Text>
                                    }
                                />
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 9, opacity: 0.5, fontFamily: "monospace" }}
                                >
                                    {account.id}
                                </Text>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {selectedAccount ? (
                <Card variant="borderless">
                    <div
                        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}
                    >
                        <InfoCircleOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                        <div>
                            <Title level={5} style={{ margin: 0 }}>
                                Adjust {selectedCurrencyMeta?.code || selectedAccount.currencyId}{" "}
                                Wallet
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Direct platform-to-member ledger adjustment
                            </Text>
                        </div>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                            type: "credit",
                            amount: 0,
                            reasonSelect: "Manual Adjustment",
                        }}
                    >
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="type"
                                    label="Adjustment Type"
                                    rules={[{ required: true }]}
                                >
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
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="amount"
                                    label="Adjustment Amount"
                                    rules={[{ required: true, type: "number", min: 0.01 }]}
                                >
                                    <InputNumber
                                        style={{ height: 48, lineHeight: "48px", width: "100%" }}
                                        size="large"
                                        precision={2}
                                        prefix={
                                            <span style={{ opacity: 0.4 }}>
                                                {selectedCurrencyMeta?.symbol || "$"}
                                            </span>
                                        }
                                        placeholder="0.00"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="reasonSelect"
                            label="Adjustment Reason"
                            rules={[{ required: true }]}
                        >
                            <Select
                                size="large"
                                onChange={handleReasonChange}
                                style={{ height: 48 }}
                            >
                                {COMMON_REASONS.map((r) => (
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
                                            {selectedCurrencyMeta?.code ||
                                                selectedAccount.currencyId}
                                        </b>
                                        . You must first fund the organization's{" "}
                                        {selectedCurrencyMeta?.code || "USD"} wallet before
                                        crediting members.
                                    </span>
                                }
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        <Divider />

                        <div
                            style={{
                                padding: 16,
                                background: "var(--ant-color-fill-quaternary)",
                                borderRadius: 8,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ maxWidth: "60%" }}>
                                <Text
                                    strong
                                    type="secondary"
                                    style={{
                                        fontSize: 10,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                    }}
                                >
                                    Internal Ledger Check
                                </Text>
                                <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
                                    This action will be finalized as an <b>internal transfer</b>{" "}
                                    between the <b>Organization's Funding Account</b> and this
                                    member.
                                </Paragraph>
                            </div>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isPending}
                                disabled={!orgFundingAccount}
                                size="large"
                                style={{ fontWeight: 600 }}
                            >
                                Execute Adjustment
                            </Button>
                        </div>
                    </Form>
                </Card>
            ) : (
                <div
                    style={{
                        padding: "64px 24px",
                        textAlign: "center",
                        background: "var(--ant-color-fill-quaternary)",
                        borderRadius: 12,
                        border: "1px dashed var(--ant-color-border)",
                    }}
                >
                    <WalletOutlined
                        style={{
                            fontSize: 48,
                            color: "var(--ant-color-text-quaternary)",
                            marginBottom: 16,
                        }}
                    />
                    <Title level={5} type="secondary">
                        Select a Wallet to Adjust
                    </Title>
                    <Text type="secondary">
                        Pick one of the member's currency wallets above to perform a manual
                        adjustment.
                    </Text>
                </div>
            )}
        </div>
    );
};
