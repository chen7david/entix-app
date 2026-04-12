import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    InfoCircleOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCY_CONFIG, getTreasuryAccountId } from "@shared";
import {
    Alert,
    Button,
    Col,
    Drawer,
    Flex,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Radio,
    Row,
    Select,
    Space,
    Tabs,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useEffect, useState } from "react";

const { Text, Title } = Typography;

import type { WalletAccountDTO } from "@shared";
import { useAdminOrganizations } from "@web/src/features/admin/hooks/useAdminOrganizations";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { useAdminOrgAccounts } from "../hooks/useAdminOrgAccounts";
import { useAdminTransfer } from "../hooks/useAdminTransfer";

type Props = {
    open: boolean;
    onClose: () => void;
    organizationId?: string;
    onOrgChange?: (orgId: string) => void;
    preSelectedAccount?: WalletAccountDTO;
};

const COMMON_REASONS = ["Funding", "System Correction", "Support Grant", "Reimbursement", "Other"];

export const AdminCreditDrawer: React.FC<Props> = ({
    open,
    onClose,
    organizationId,
    onOrgChange,
    preSelectedAccount,
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState<"treasury" | "funding">("funding");
    const [direction, setDirection] = useState<"credit" | "debit">("credit");
    const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("fcur_usd");

    const { credit, debit, ensureFunding } = useAdminTransfer();
    const { data: orgs, isLoading: isLoadingOrgs } = useAdminOrganizations();
    const { data: orgAccounts } = useAdminOrgAccounts(organizationId);

    const isPending = credit.isPending || debit.isPending || ensureFunding.isPending;

    const orgFundingAccount = orgAccounts?.find(
        (a) => a.currencyId === selectedCurrencyId && a.accountType === "funding"
    );
    const selectedCurrencyConfig =
        FINANCIAL_CURRENCY_CONFIG[selectedCurrencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];

    useEffect(() => {
        if (open) {
            if (preSelectedAccount) {
                setSelectedCurrencyId(preSelectedAccount.currencyId);
                setActiveTab("treasury");
                form.setFieldsValue({
                    currencyId: preSelectedAccount.currencyId,
                    reasonSelect: COMMON_REASONS[0],
                });
            } else {
                setSelectedCurrencyId("fcur_usd");
                form.setFieldsValue({
                    currencyId: "fcur_usd",
                    reasonSelect: COMMON_REASONS[0],
                });
                setActiveTab("funding");
            }
        }
    }, [open, preSelectedAccount, form]);

    const handleOrgChange = (value: string) => {
        onOrgChange?.(value);
    };

    const handleCreateFunding = async () => {
        if (!organizationId) return;
        try {
            await ensureFunding.mutateAsync({
                organizationId,
                currencyId: selectedCurrencyId,
            });
        } catch (err) {
            console.error(err);
        }
    };

    const onFinish = async (values: any) => {
        const amountCents = Math.round(values.amountDollars * 100);
        const description =
            values.reasonSelect === "Other" ? values.description : values.reasonSelect;
        const platformTreasuryAccountId = getTreasuryAccountId(selectedCurrencyId);
        const categoryId = FINANCIAL_CATEGORIES.CASH_DEPOSIT;

        try {
            if (activeTab === "treasury") {
                if (!preSelectedAccount) return;

                // Guard: prevent self-transfer when the selected account IS the treasury account
                if (preSelectedAccount.id === platformTreasuryAccountId) {
                    console.error("Cannot transfer to/from the same treasury account.");
                    return;
                }

                const targetOrgId = preSelectedAccount.ownerId || "platform";

                if (direction === "credit") {
                    await credit.mutateAsync({
                        organizationId: targetOrgId,
                        categoryId,
                        platformTreasuryAccountId,
                        destinationAccountId: preSelectedAccount.id,
                        currencyId: selectedCurrencyId,
                        amountCents,
                        description,
                    });
                } else {
                    await debit.mutateAsync({
                        organizationId: targetOrgId,
                        categoryId,
                        sourceAccountId: preSelectedAccount.id,
                        platformTreasuryAccountId,
                        currencyId: selectedCurrencyId,
                        amountCents,
                        description,
                    });
                }
            } else {
                if (!organizationId || !orgFundingAccount) return;

                if (direction === "credit") {
                    await credit.mutateAsync({
                        organizationId,
                        categoryId,
                        platformTreasuryAccountId,
                        destinationAccountId: orgFundingAccount.id,
                        currencyId: selectedCurrencyId,
                        amountCents,
                        description: description || "Organization Funding",
                    });
                } else {
                    await debit.mutateAsync({
                        organizationId,
                        categoryId,
                        sourceAccountId: orgFundingAccount.id,
                        platformTreasuryAccountId,
                        currencyId: selectedCurrencyId,
                        amountCents,
                        description: description || "Organization Funding Return",
                    });
                }
            }
            form.resetFields();
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Drawer
            title={
                <Space direction="vertical" size={0}>
                    <Title level={5} style={{ margin: 0 }}>
                        Admin Ledger Adjustment
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Platform stewardship and org funding
                    </Text>
                </Space>
            }
            width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
            open={open}
            onClose={onClose}
            extra={
                <Button type="primary" onClick={() => form.submit()} loading={isPending}>
                    {activeTab === "treasury" ? "Adjust Treasury" : "Fund Organization"}
                </Button>
            }
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as any)}
                    items={[
                        {
                            key: "funding",
                            label: "Organization Funding",
                            children: (
                                <div style={{ marginTop: 24 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            marginBottom: 24,
                                        }}
                                    >
                                        <WalletOutlined
                                            style={{ color: token.colorPrimary, fontSize: 18 }}
                                        />
                                        <div>
                                            <Title level={5} style={{ margin: 0 }}>
                                                General Fund {selectedCurrencyConfig?.code}
                                            </Title>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Platform-to-organization liquidity transfer
                                            </Text>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 24 }}>
                                        <Text
                                            type="secondary"
                                            style={{ display: "block", marginBottom: 8 }}
                                        >
                                            Organization Context
                                        </Text>
                                        <Select
                                            size="large"
                                            placeholder="Select organization"
                                            style={{ width: "100%" }}
                                            value={organizationId}
                                            onChange={handleOrgChange}
                                            showSearch
                                            loading={isLoadingOrgs}
                                            options={orgs?.items?.map((o) => ({
                                                label: o.name,
                                                value: o.id,
                                            }))}
                                            optionFilterProp="label"
                                        />
                                    </div>

                                    {organizationId ? (
                                        !orgFundingAccount ? (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                style={{ marginBottom: 24 }}
                                                message={`No ${selectedCurrencyConfig?.code} funding account`}
                                                description={
                                                    <Flex vertical gap={8} style={{ marginTop: 8 }}>
                                                        <Text>
                                                            Super admin must provision this first.
                                                        </Text>
                                                        <Popconfirm
                                                            title="Create funding account?"
                                                            description={`Create "General Fund — ${selectedCurrencyConfig?.code}"?`}
                                                            onConfirm={handleCreateFunding}
                                                            okText="Create"
                                                        >
                                                            <Button size="small" type="primary">
                                                                Create Funding Account
                                                            </Button>
                                                        </Popconfirm>
                                                    </Flex>
                                                }
                                            />
                                        ) : (
                                            <Alert
                                                message={
                                                    <Space>
                                                        <Text strong>Org Funding:</Text>
                                                        <Text>{orgFundingAccount.name}</Text>
                                                    </Space>
                                                }
                                                description={
                                                    <Text type="secondary">
                                                        Current Balance:{" "}
                                                        {selectedCurrencyConfig?.symbol}
                                                        {(
                                                            orgFundingAccount.balanceCents / 100
                                                        ).toFixed(2)}{" "}
                                                        {selectedCurrencyConfig?.code}
                                                    </Text>
                                                }
                                                type="success"
                                                showIcon
                                                style={{ marginBottom: 24 }}
                                            />
                                        )
                                    ) : (
                                        <Alert
                                            message="Select an organization above"
                                            type="info"
                                            showIcon
                                            style={{ marginBottom: 24 }}
                                        />
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "treasury",
                            label: "Treasury Funding",
                            children: (
                                <div style={{ marginTop: 24 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            marginBottom: 24,
                                        }}
                                    >
                                        <InfoCircleOutlined
                                            style={{ color: token.colorPrimary, fontSize: 18 }}
                                        />
                                        <div>
                                            <Title level={5} style={{ margin: 0 }}>
                                                Adjust {selectedCurrencyConfig?.code} Wallet
                                            </Title>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Direct platform-to-account manual adjustment
                                            </Text>
                                        </div>
                                    </div>
                                    {preSelectedAccount ? (
                                        <>
                                            <Alert
                                                message={
                                                    <Space>
                                                        <Text strong>Target:</Text>
                                                        <Text>{preSelectedAccount.name}</Text>
                                                    </Space>
                                                }
                                                description={
                                                    <Text type="secondary">
                                                        Current Balance:{" "}
                                                        {selectedCurrencyConfig?.symbol}
                                                        {(
                                                            preSelectedAccount.balanceCents / 100
                                                        ).toFixed(2)}{" "}
                                                        {selectedCurrencyConfig?.code}
                                                    </Text>
                                                }
                                                type="info"
                                                showIcon
                                                style={{ marginBottom: 24 }}
                                            />
                                            {preSelectedAccount.id ===
                                                getTreasuryAccountId(selectedCurrencyId) && (
                                                <Alert
                                                    type="error"
                                                    showIcon
                                                    style={{ marginBottom: 24 }}
                                                    message="Self-transfer not allowed"
                                                    description="This account is the platform treasury source. Select a different destination account."
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <Alert
                                            message="No account selected"
                                            description="Click a card on the main grid to pre-fill the adjustment target."
                                            type="warning"
                                            showIcon
                                            style={{ marginBottom: 24 }}
                                        />
                                    )}
                                </div>
                            ),
                        },
                    ]}
                />

                <div style={{ marginTop: 0 }}>
                    <Form.Item name="direction" label="Adjustment Type" initialValue="credit">
                        <Radio.Group
                            value={direction}
                            onChange={(e) => setDirection(e.target.value)}
                            style={{ width: "100%", display: "flex" }}
                        >
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

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="currencyId"
                                label="Currency"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    size="large"
                                    disabled={!!preSelectedAccount}
                                    onChange={setSelectedCurrencyId}
                                    style={{ height: 48 }}
                                >
                                    {Object.entries(FINANCIAL_CURRENCY_CONFIG).map(
                                        ([id, config]) => (
                                            <Select.Option key={id} value={id}>
                                                {config.code}
                                            </Select.Option>
                                        )
                                    )}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="amountDollars"
                                label="Amount"
                                rules={[{ required: true }, { type: "number", min: 0.01 }]}
                            >
                                <InputNumber
                                    size="large"
                                    style={{ height: 48, lineHeight: "48px", width: "100%" }}
                                    min={0.01}
                                    precision={2}
                                    prefix={
                                        <span style={{ opacity: 0.4 }}>
                                            {selectedCurrencyConfig?.symbol || "$"}
                                        </span>
                                    }
                                    placeholder="0.00"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="reasonSelect" label="Reason" rules={[{ required: true }]}>
                        <Select
                            size="large"
                            onChange={(val) =>
                                form.setFieldsValue({
                                    description: val === "Other" ? "" : val,
                                })
                            }
                        >
                            {COMMON_REASONS.map((r) => (
                                <Select.Option key={r} value={r}>
                                    {r}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        shouldUpdate={(prev, curr) => prev.reasonSelect !== curr.reasonSelect}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue("reasonSelect") === "Other" && (
                                <Form.Item
                                    name="description"
                                    label="Custom Reason"
                                    rules={[{ required: true }]}
                                >
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Describe the adjustment..."
                                    />
                                </Form.Item>
                            )
                        }
                    </Form.Item>
                </div>
            </Form>
        </Drawer>
    );
};
