import {
    ClockCircleOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { useTransactionHistory } from "@web/src/features/wallet/hooks/useTransactionHistory";
import type { WalletAccount } from "@web/src/features/wallet/hooks/useWalletBalance";
import {
    Button,
    Card,
    Divider,
    Drawer,
    Form,
    Input,
    List,
    message,
    Popconfirm,
    Space,
    Tag,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useEffect } from "react";
import { useArchiveAccount, useUpdateAccount } from "../hooks/useAccountManagement";

const { Title, Text } = Typography;

type Props = {
    open: boolean;
    onClose: () => void;
    account: WalletAccount | null;
    orgId?: string;
};

export const ManageAccountDrawer: React.FC<Props> = ({ open, onClose, account, orgId }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const { mutate: update, isPending: isUpdating } = useUpdateAccount();
    const { mutate: archive, isPending: isArchiving } = useArchiveAccount();

    const { data: history, isLoading: isLoadingHistory } = useTransactionHistory(
        orgId, // orgId is the primary ID for org-level history
        "org",
        1,
        3,
        undefined,
        account?.id // Filter by this specific account
    );

    useEffect(() => {
        if (account) {
            form.setFieldsValue({ name: account.name });
        }
    }, [account, form]);

    const handleUpdate = async (values: { name: string }) => {
        if (!account) return;
        update(
            { id: account.id, name: values.name },
            {
                onSuccess: () => {
                    message.success("Account label updated");
                    onClose();
                },
            }
        );
    };

    const handleArchive = () => {
        if (!account) return;
        archive(account.id, {
            onSuccess: () => {
                message.success("Account archived successfully");
                onClose();
            },
            onError: (err) => {
                message.error(err.message);
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
            width={440}
            onClose={onClose}
            open={open}
            styles={{ body: { paddingBottom: 80 } }}
            extra={
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={isUpdating}
                    onClick={() => form.submit()}
                >
                    Save Changes
                </Button>
            }
        >
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>
                    {account.name}
                </Title>
                <Space size={4} style={{ marginTop: 4 }}>
                    <Tag color="success">ACTIVE</Tag>
                    {account.isFundingAccount && <Tag color="purple">FUNDING</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {currencyMeta?.code} • {account.id.split("_").pop()}
                    </Text>
                </Space>
            </div>

            <Form form={form} layout="vertical" onFinish={handleUpdate}>
                <Form.Item
                    name="name"
                    label="Account Label"
                    rules={[{ required: true, message: "Please enter an account name" }]}
                >
                    <Input size="large" placeholder="Enter account display name" />
                </Form.Item>
            </Form>

            <Divider orientation="left" style={{ margin: "32px 0 16px" }}>
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
                                <ClockCircleOutlined style={{ color: token.colorTextTertiary }} />
                            }
                            title={
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <Text strong>{tx.category?.name || "Transfer"}</Text>
                                    <Text strong>
                                        {tx.currency?.symbol ?? "$"}
                                        {(tx.amountCents / 100).toFixed(2)}
                                    </Text>
                                </div>
                            }
                            description={
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {new Date(tx.transactionDate).toLocaleString()}
                                </Text>
                            }
                        />
                    </List.Item>
                )}
            />

            <Divider orientation="left" style={{ margin: "32px 0 16px" }}>
                Administrative Actions
            </Divider>
            <Card
                size="small"
                styles={{ body: { background: token.colorErrorBg } }}
                style={{ borderColor: token.colorErrorBorder }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <InfoCircleOutlined style={{ color: token.colorError, marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                        <Text strong style={{ display: "block" }}>
                            Archive Account
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                            This will hide the account from all dashboards. You can only archive
                            accounts with a zero balance.
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
        </Drawer>
    );
};
