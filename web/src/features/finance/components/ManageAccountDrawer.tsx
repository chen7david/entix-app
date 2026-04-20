import {
    ClockCircleOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG, type WalletAccountDTO } from "@shared";
import { TransactionAmount } from "@web/src/components/ui/TransactionAmount";
import { useTransactionHistory } from "@web/src/features/wallet/hooks/useTransactionHistory";
import { formatAccountDisplayName } from "@web/src/lib/account-display";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import {
    App,
    Button,
    Card,
    Divider,
    Drawer,
    Form,
    Input,
    List,
    Popconfirm,
    Space,
    Tabs,
    Tag,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useArchiveAccount, useUpdateAccount } from "../hooks/useAccountManagement";
import { StudentFundingTab } from "./StudentFundingTab";

const { Title, Text } = Typography;

type Props = {
    open: boolean;
    onClose: () => void;
    account: WalletAccountDTO | null;
    orgId?: string;
    size?: "default" | "large";
};

export const ManageAccountDrawer: React.FC<Props> = ({
    open,
    onClose,
    account,
    orgId,
    size = "default",
}) => {
    const { notification } = App.useApp();
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState<"student-funding" | "rename">("student-funding");
    const { mutate: update, isPending: isUpdating } = useUpdateAccount();
    const { mutate: archive, isPending: isArchiving } = useArchiveAccount();

    const { data: history, isLoading: isLoadingHistory } = useTransactionHistory(
        orgId,
        "org",
        undefined,
        3,
        undefined,
        { accountId: account?.id }
    );

    useEffect(() => {
        if (open) {
            setActiveTab("student-funding");
        }
        if (account) {
            form.setFieldsValue({ name: account.name });
        }
    }, [open, account, form]);

    const handleUpdate = async (values: { name: string }) => {
        if (!account) return;
        update(
            { id: account.id, name: values.name },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Label Updated",
                        description: "Account label updated successfully.",
                    });
                    onClose();
                },
            }
        );
    };

    const handleArchive = () => {
        if (!account) return;
        archive(account.id, {
            onSuccess: () => {
                notification.success({
                    message: "Account Archived",
                    description: "Treasury account archived successfully.",
                });
                onClose();
            },
            onError: (err) => {
                notification.error({
                    message: "Archive Failed",
                    description: err.message || "Failed to archive treasury account.",
                });
            },
        });
    };

    if (!account) return null;

    const currencyMeta =
        FINANCIAL_CURRENCY_CONFIG[account.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];

    return (
        <Drawer
            title="Manage Treasury Account"
            placement="right"
            size={size}
            onClose={onClose}
            open={open}
            styles={{
                body: { paddingBottom: 80 },
                wrapper: {
                    width: size === "default" ? UI_CONSTANTS.RIGHT_DRAWER_WIDTH : undefined,
                },
            }}
        >
            <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                    {formatAccountDisplayName(account.name, currencyMeta?.code)}
                </Title>
                <Space size={4} style={{ marginTop: 4 }}>
                    <Tag color="success">ACTIVE</Tag>
                    {account.accountType === "funding" && <Tag color="purple">FUNDING</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {currencyMeta?.code} • {account.id.split("_").pop()}
                    </Text>
                </Space>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as "student-funding" | "rename")}
                items={[
                    {
                        key: "student-funding",
                        label: "Student Funding",
                        children: orgId ? (
                            <StudentFundingTab orgId={orgId} account={account} />
                        ) : (
                            <Text type="secondary">No organization context available.</Text>
                        ),
                    },
                    {
                        key: "rename",
                        label: "Rename Account",
                        children: (
                            <div style={{ paddingTop: 8 }}>
                                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                                    <Form.Item
                                        name="name"
                                        label="Account Label"
                                        rules={[
                                            {
                                                required: true,
                                                message: "Please enter an account name",
                                            },
                                        ]}
                                    >
                                        <Input
                                            size="large"
                                            placeholder="Enter account display name"
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<SaveOutlined />}
                                            loading={isUpdating}
                                            size="large"
                                            style={{ width: "100%" }}
                                        >
                                            Save Changes
                                        </Button>
                                    </Form.Item>
                                </Form>

                                <Divider titlePlacement="left" style={{ margin: "32px 0 16px" }}>
                                    Recent Activity
                                </Divider>

                                <List
                                    loading={isLoadingHistory}
                                    dataSource={history?.data || []}
                                    locale={{ emptyText: "No recent transactions" }}
                                    renderItem={(tx) => (
                                        <List.Item style={{ padding: "12px 0" }}>
                                            <List.Item.Meta
                                                avatar={
                                                    <ClockCircleOutlined
                                                        style={{
                                                            color: token.colorTextTertiary,
                                                        }}
                                                    />
                                                }
                                                title={
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                        }}
                                                    >
                                                        <Text strong>
                                                            {tx.category?.name || "Transfer"}
                                                        </Text>
                                                        <TransactionAmount
                                                            amountCents={tx.amountCents}
                                                            currencySymbol={
                                                                tx.currency?.symbol ?? "$"
                                                            }
                                                            currencyCode={tx.currency?.code}
                                                            compact
                                                        />
                                                    </div>
                                                }
                                                description={
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        {new Date(
                                                            tx.transactionDate
                                                        ).toLocaleString()}
                                                    </Text>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />

                                <Divider titlePlacement="left" style={{ margin: "32px 0 16px" }}>
                                    Administrative Actions
                                </Divider>

                                <Card
                                    size="small"
                                    styles={{ body: { background: token.colorErrorBg } }}
                                    style={{ borderColor: token.colorErrorBorder }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 12,
                                        }}
                                    >
                                        <InfoCircleOutlined
                                            style={{ color: token.colorError, marginTop: 4 }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ display: "block" }}>
                                                Archive Account
                                            </Text>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 12, display: "block" }}
                                            >
                                                This will hide the account from all dashboards. You
                                                can only archive accounts with a zero balance.
                                            </Text>
                                            <Popconfirm
                                                title="Archive this account?"
                                                description="Are you sure you want to archive this treasury account?"
                                                onConfirm={handleArchive}
                                                okText="Yes, Archive"
                                                cancelText="No"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <Button
                                                    danger
                                                    type="text"
                                                    icon={<DeleteOutlined />}
                                                    loading={isArchiving}
                                                    style={{ marginTop: 8, padding: 0 }}
                                                >
                                                    Archive Account
                                                </Button>
                                            </Popconfirm>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ),
                    },
                ]}
            />
        </Drawer>
    );
};
