import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    UserOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG, type MemberDTO, type WalletAccountDTO } from "@shared";
import { POSInput } from "@web/src/components/ui/POSInput";
import { useMembers } from "@web/src/features/organization/hooks/useMembers";
import { useInitializeWallet } from "@web/src/features/wallet/hooks/useInitializeWallet";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";
import { FINANCIAL_ADJUSTMENT_REASONS, UI_CONSTANTS } from "@web/src/utils/constants";
import {
    Avatar,
    Button,
    Divider,
    Form,
    Input,
    Popconfirm,
    Radio,
    Select,
    Space,
    Typography,
} from "antd";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminAdjustWallet } from "../hooks/useAdminAdjustWallet";

const { Text } = Typography;

const DEFAULT_REASON = FINANCIAL_ADJUSTMENT_REASONS[0];

type Props = {
    orgId: string;
    account: WalletAccountDTO;
};

export const StudentFundingTab: React.FC<Props> = ({ orgId, account }) => {
    const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);
    const [reasonType, setReasonType] = useState<string>(DEFAULT_REASON);
    const [searchInput, setSearchInput] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [form] = Form.useForm();

    const selectedMemberId = selectedMember?.id ?? null;
    const selectedUserId = selectedMember?.userId;

    // Server-side debounced search — no limit option so the infinite query
    // mode is used and ?search= is applied across all members in the DB.
    const { members, loadingMembers } = useMembers(debouncedSearch || undefined);

    const { data: memberWallet, isLoading: isLoadingMemberWallet } = useWalletBalance(
        selectedUserId,
        "user",
        orgId
    );

    const { data: orgWallet } = useWalletBalance(orgId, "org");
    const { mutate: adjust, isPending } = useAdminAdjustWallet(orgId);
    const { mutate: initializeWallet, isPending: isInitializing } = useInitializeWallet(orgId);

    const currencyMeta =
        FINANCIAL_CURRENCY_CONFIG[account.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];

    const memberAccounts = memberWallet?.accounts ?? [];
    const walletReady = !!selectedUserId && !isLoadingMemberWallet && memberAccounts.length > 0;
    const walletMissing = !!selectedUserId && !isLoadingMemberWallet && memberAccounts.length === 0;
    const studentAccount = memberAccounts.find((a) => a.currencyId === account.currencyId);
    const orgFundingAccount = (orgWallet?.accounts ?? []).find(
        (a) => a.currencyId === account.currencyId && a.accountType === "funding"
    );

    const formDisabled = !walletReady || !studentAccount || !orgFundingAccount;

    const walletStatus = !selectedUserId
        ? null
        : isLoadingMemberWallet
          ? "checking..."
          : walletMissing
            ? "no wallet"
            : !studentAccount
              ? `no ${currencyMeta?.code ?? account.currencyId} account`
              : `${currencyMeta?.symbol}${(studentAccount.balanceCents / 100).toFixed(2)} ${currencyMeta?.code}`;

    // Clear debounce timer on unmount to prevent setState on an unmounted component.
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    useEffect(() => {
        if (selectedMemberId !== undefined) {
            form.resetFields();
            setReasonType(DEFAULT_REASON);
            form.setFieldsValue({ reasonSelect: DEFAULT_REASON });
        }
    }, [selectedMemberId, form]);

    const handleSearch = (value: string) => {
        setSearchInput(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(value);
        }, UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE);
    };

    const handleMemberChange = (val: string | undefined) => {
        if (!val) {
            setSelectedMember(null);
        } else {
            const member = members.find((m) => m.id === val) ?? null;
            setSelectedMember(member);
        }
        // Reset search so the full list is shown on the next open
        // and the input field is cleared after selection.
        setSearchInput("");
        setDebouncedSearch("");
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };

    const handleReasonChange = (value: string) => {
        setReasonType(value);
        form.setFieldsValue({ description: value !== "Other" ? value : "" });
    };

    const onFinish = (values: any) => {
        if (!studentAccount || !orgFundingAccount) return;
        const finalDescription =
            values.reasonSelect === "Other" ? values.description : values.reasonSelect;
        adjust(
            {
                organizationId: orgId,
                accountId: studentAccount.id,
                platformTreasuryAccountId: orgFundingAccount.id,
                amountCents: Math.round(values.amount * 100),
                currencyId: account.currencyId,
                description: finalDescription || `Admin ${values.type}`,
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

    const studentOptions = useMemo(() => {
        const baseOptions = members.map((m) => ({
            label: m.name ?? m.email ?? m.userId,
            value: m.id,
            avatarUrl: m.avatarUrl ?? null,
            email: m.email ?? null,
        }));

        // If the selected student isn't in the current search results page,
        // we must manually add them to the options list so the Select component
        // can still resolve their ID to a display name.
        if (selectedMember && !baseOptions.some((o) => o.value === selectedMember.id)) {
            return [
                {
                    label: selectedMember.name ?? selectedMember.email ?? selectedMember.userId,
                    value: selectedMember.id,
                    avatarUrl: selectedMember.avatarUrl ?? null,
                    email: selectedMember.email ?? null,
                },
                ...baseOptions,
            ];
        }

        return baseOptions;
    }, [members, selectedMember]);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ type: "credit", amount: 0, reasonSelect: DEFAULT_REASON }}
            style={{ padding: "8px 0" }}
        >
            {/* ── Student selector ── */}
            <Form.Item
                label="Select Student"
                style={{ marginBottom: 8 }}
                tooltip="Choose the student whose wallet you want to adjust"
                extra={
                    walletStatus && (
                        <Space size={4} style={{ marginTop: 4 }}>
                            <WalletOutlined style={{ opacity: 0.45 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {walletStatus}
                            </Text>
                            {walletMissing && (
                                <Popconfirm
                                    title="Activate student wallet?"
                                    description={`Initialize a wallet for ${selectedMember?.name ?? "this student"}.`}
                                    onConfirm={() =>
                                        selectedUserId && initializeWallet(selectedUserId)
                                    }
                                    okText="Activate"
                                    cancelText="Cancel"
                                >
                                    <Button
                                        type="link"
                                        size="small"
                                        loading={isInitializing}
                                        style={{ padding: 0, height: "auto" }}
                                    >
                                        Activate
                                    </Button>
                                </Popconfirm>
                            )}
                        </Space>
                    )
                }
            >
                <Select
                    size="large"
                    placeholder="Search and select a student..."
                    value={selectedMemberId}
                    onChange={handleMemberChange}
                    loading={loadingMembers}
                    showSearch
                    allowClear
                    filterOption={false}
                    searchValue={searchInput}
                    onSearch={handleSearch}
                    style={{ width: "100%" }}
                    options={studentOptions}
                    optionRender={(option) => (
                        <Space size={10} style={{ padding: "2px 0" }}>
                            <Avatar
                                size={28}
                                src={option.data.avatarUrl ?? undefined}
                                icon={!option.data.avatarUrl && <UserOutlined />}
                                style={{ flexShrink: 0 }}
                            />
                            <div style={{ lineHeight: 1.3 }}>
                                <div style={{ fontWeight: 500 }}>{option.label}</div>
                                {option.data.email && (
                                    <div style={{ fontSize: 11, opacity: 0.5 }}>
                                        {option.data.email}
                                    </div>
                                )}
                            </div>
                        </Space>
                    )}
                />
            </Form.Item>

            <Divider
                style={{ marginTop: 0, marginBottom: 16, borderStyle: "dashed", opacity: 0.4 }}
            />

            {/* ── Adjustment type ── */}
            <Form.Item name="type" label="Adjustment Type" rules={[{ required: true }]}>
                <Radio.Group style={{ width: "100%", display: "flex" }} disabled={formDisabled}>
                    <Radio.Button
                        value="credit"
                        style={{ flex: 1, textAlign: "center", height: 48, lineHeight: "46px" }}
                    >
                        <Space>
                            <ArrowUpOutlined style={{ color: "var(--ant-color-success)" }} />
                            CREDIT
                        </Space>
                    </Radio.Button>
                    <Radio.Button
                        value="debit"
                        style={{ flex: 1, textAlign: "center", height: 48, lineHeight: "46px" }}
                    >
                        <Space>
                            <ArrowDownOutlined style={{ color: "var(--ant-color-error)" }} />
                            DEBIT
                        </Space>
                    </Radio.Button>
                </Radio.Group>
            </Form.Item>

            {/* ── Amount ── */}
            <Form.Item
                name="amount"
                label="Adjustment Amount"
                rules={[{ required: true, type: "number", min: 0.01 }]}
            >
                <POSInput
                    size="large"
                    prefix={currencyMeta?.symbol ?? "$"}
                    placeholder="0.00"
                    disabled={formDisabled}
                />
            </Form.Item>

            {/* ── Reason ── */}
            <Form.Item name="reasonSelect" label="Adjustment Reason" rules={[{ required: true }]}>
                <Select
                    size="large"
                    onChange={handleReasonChange}
                    style={{ height: 48 }}
                    disabled={formDisabled}
                >
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
                        placeholder="E.g., Reimbursement for excessive usage..."
                        rows={3}
                        disabled={formDisabled}
                    />
                </Form.Item>
            )}

            {/* ── Submit ── */}
            <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isPending}
                    disabled={formDisabled}
                    size="large"
                    style={{ fontWeight: 600, width: "100%" }}
                >
                    Execute Adjustment
                </Button>
            </Form.Item>
        </Form>
    );
};
