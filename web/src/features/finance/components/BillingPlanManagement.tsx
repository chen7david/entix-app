import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { BillingPlanDTO, UpdateBillingPlanInput } from "@shared/schemas/dto/billing-plan.dto";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import {
    useBillingPlanActions,
    useBillingPlans,
} from "@web/src/features/finance/hooks/useBillingPlans";
import type { CurrencyWithStatus } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { useOrgCurrencies } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { DateUtils } from "@web/src/utils/date";
import {
    App,
    Button,
    Drawer,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Switch,
    Tag,
    Typography,
    theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

interface BillingPlanFormProps {
    orgId: string;
    initialValues?: Partial<BillingPlanDTO>;
    onFinish: (values: any) => void;
    isLoading: boolean;
}

const BillingPlanForm: React.FC<BillingPlanFormProps> = ({
    orgId,
    initialValues,
    onFinish,
    isLoading,
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const { data: currencies } = useOrgCurrencies(orgId);

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={
                initialValues || {
                    isActive: true,
                    rates: [{ participantCount: 1, rateCentsPerMinute: 0 }],
                }
            }
            onFinish={(values) => {
                // Map rates back to cents
                const submission = {
                    ...values,
                    overdraftLimitCents: Math.round((values.overdraftLimitDollars || 0) * 100),
                    rates:
                        values.rates?.map((r: any) => ({
                            ...r,
                            rateCentsPerMinute: Math.round(r.rateCentsPerMinute * 100),
                        })) || [],
                };
                onFinish(submission);
            }}
        >
            <Form.Item
                name="name"
                label="Plan Name"
                rules={[{ required: true, message: "Please enter plan name" }]}
            >
                <Input placeholder="e.g. Standard Hourly" variant="outlined" />
            </Form.Item>

            <Form.Item
                name="overdraftLimitDollars"
                label="Default Overdraft Limit"
                tooltip="The maximum negative balance allowed for accounts on this plan if not overridden at the account level."
            >
                <InputNumber
                    min={0}
                    precision={2}
                    prefix="$"
                    className="w-full"
                    placeholder="0.00"
                />
            </Form.Item>

            <Form.Item name="description" label="Description">
                <Input.TextArea placeholder="Internal description" variant="outlined" rows={3} />
            </Form.Item>

            <Form.Item
                name="currencyId"
                label="Currency"
                rules={[{ required: true, message: "Please select currency" }]}
            >
                <Select
                    disabled={!!initialValues?.id}
                    placeholder="Select currency"
                    options={currencies?.map((c: CurrencyWithStatus) => ({
                        label: c.code,
                        value: c.id,
                    }))}
                />
            </Form.Item>

            <div className="mt-4 mb-2">
                <Text strong>Rate Tiers</Text>
            </div>

            <Form.List
                name="rates"
                rules={[
                    {
                        validator: async (_, rates) => {
                            if (!rates || rates.length < 1) {
                                return Promise.reject(new Error("At least one rate tier required"));
                            }
                            const counts = rates.map((r: any) => r.participantCount);
                            if (new Set(counts).size !== counts.length) {
                                return Promise.reject(
                                    new Error("Rate tiers must have unique student counts")
                                );
                            }
                        },
                    },
                ]}
            >
                {(fields, { add, remove }, { errors }) => (
                    <div className="flex flex-col gap-3">
                        {fields.map(({ key, name, ...restField }) => (
                            <div
                                key={key}
                                className="flex items-start gap-4 p-4 rounded-lg border border-solid"
                                style={{
                                    backgroundColor: token.colorFillQuaternary,
                                    borderColor: token.colorBorderSecondary,
                                }}
                            >
                                <Form.Item
                                    {...restField}
                                    name={[name, "participantCount"]}
                                    label="Student Count"
                                    rules={[{ required: true, message: "Req" }]}
                                    className="mb-0 flex-1"
                                >
                                    <InputNumber
                                        min={1}
                                        addonBefore="≥"
                                        className="w-full"
                                        placeholder="Min students"
                                    />
                                </Form.Item>

                                <Form.Item
                                    {...restField}
                                    name={[name, "rateCentsPerMinute"]}
                                    label="Rate / min"
                                    rules={[{ required: true, message: "Req" }]}
                                    className="mb-0 flex-1"
                                >
                                    <InputNumber<number>
                                        min={0}
                                        className="w-full"
                                        placeholder="0.00"
                                        step={0.01}
                                        formatter={(value) =>
                                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                        }
                                        parser={(value) =>
                                            value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                                        }
                                    />
                                </Form.Item>

                                <Button
                                    type="text"
                                    danger
                                    className="mt-8"
                                    icon={<DeleteOutlined />}
                                    onClick={() => remove(name)}
                                />
                            </div>
                        ))}

                        <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                            className="mt-2"
                        >
                            Add Rate Tier
                        </Button>
                        <Form.ErrorList errors={errors} />
                    </div>
                )}
            </Form.List>

            <div className="flex justify-end gap-2 mt-8">
                <Button onClick={() => form.resetFields()}>Reset</Button>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    {initialValues?.id ? "Update Plan" : "Create Plan"}
                </Button>
            </div>
        </Form>
    );
};

export const BillingPlanManagement: React.FC<{ orgId: string }> = ({ orgId }) => {
    const { modal } = App.useApp();
    const [search, setSearch] = useState("");
    const [limit, setLimit] = useState(20);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingPlan, setEditingPlan] = useState<BillingPlanDTO | null>(null);

    const { data, isLoading: loadingPlans } = useBillingPlans(orgId, { search, limit });
    const { createPlan, updatePlan, deletePlan } = useBillingPlanActions(orgId);
    const { data: currencies } = useOrgCurrencies(orgId);

    const handleEdit = (plan: BillingPlanDTO) => {
        setEditingPlan(plan);
        setDrawerVisible(true);
    };

    const handleDelete = (plan: BillingPlanDTO) => {
        modal.confirm({
            title: "Delete Billing Plan?",
            content: `Are you sure you want to delete "${plan.name}"? This cannot be undone.`,
            okText: "Delete",
            okType: "danger",
            onOk: async () => {
                await deletePlan.mutateAsync(plan.id);
            },
        });
    };

    const columns: ColumnsType<BillingPlanDTO> = [
        {
            title: "Plan Name",
            dataIndex: "name",
            key: "name",
            render: (name, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{name}</Text>
                    <Text type="secondary" className="text-xs">
                        {record.description || "No description"}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Currency",
            dataIndex: "currencyId",
            key: "currency",
            width: 100,
            render: (id) => {
                const c = currencies?.find((curr: CurrencyWithStatus) => curr.id === id);
                return <Tag color="blue">{c?.code || id}</Tag>;
            },
        },
        {
            title: "Tiers",
            dataIndex: "rates",
            key: "tiers",
            width: 100,
            render: (rates) => <Tag>{rates?.length || 0} Tiers</Tag>,
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "status",
            width: 100,
            render: (isActive, record) => (
                <Switch
                    size="small"
                    checked={isActive}
                    loading={updatePlan.isPending && editingPlan?.id === record.id}
                    onChange={(checked) => {
                        setEditingPlan(record);
                        updatePlan.mutate({ planId: record.id, updates: { isActive: checked } });
                    }}
                />
            ),
        },
        {
            title: "Created",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 150,
            render: (date) => DateUtils.fromNow(date),
        },
        {
            title: "Actions",
            key: "actions",
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6 flex justify-between items-center">
                <Space direction="vertical" size={2}>
                    <Title level={4}>Billing Plans</Title>
                    <Text type="secondary">
                        Define tiered hourly rates for different currencies.
                    </Text>
                </Space>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingPlan(null);
                        setDrawerVisible(true);
                    }}
                >
                    Create Plan
                </Button>
            </div>

            <div className="flex-1 min-h-0">
                <DataTableWithFilters<BillingPlanDTO>
                    config={{
                        columns,
                        data: data?.data || [],
                        loading: loadingPlans,
                        rowKey: "id",
                        filters: [
                            {
                                type: "search",
                                key: "search",
                                placeholder: "Search plans...",
                            },
                        ],
                        onFiltersChange: (f) => setSearch(f.search || ""),
                        pagination: {
                            hasNextPage: !!data?.nextCursor,
                            hasPrevPage: false,
                            pageSize: limit,
                            onPageSizeChange: setLimit,
                        },
                    }}
                />
            </div>

            <Drawer
                title={editingPlan ? "Edit Billing Plan" : "Create New Plan"}
                width={520}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                destroyOnClose
            >
                <BillingPlanForm
                    orgId={orgId}
                    initialValues={
                        editingPlan
                            ? {
                                  ...editingPlan,
                                  overdraftLimitDollars:
                                      (editingPlan.overdraftLimitCents || 0) / 100,
                                  rates: editingPlan.rates?.map((r) => ({
                                      ...r,
                                      rateCentsPerMinute: r.rateCentsPerMinute / 100,
                                  })),
                              }
                            : undefined
                    }
                    isLoading={createPlan.isPending || updatePlan.isPending}
                    onFinish={async (values) => {
                        if (editingPlan) {
                            await updatePlan.mutateAsync({
                                planId: editingPlan.id,
                                updates: values as UpdateBillingPlanInput,
                            });
                        } else {
                            await createPlan.mutateAsync(values);
                        }
                        setDrawerVisible(false);
                    }}
                />
            </Drawer>
        </div>
    );
};
