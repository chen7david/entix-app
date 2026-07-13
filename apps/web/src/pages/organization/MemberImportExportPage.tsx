import {
    CheckCircleOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { normalizeBulkMembersRaw } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useBillingPlans } from "@web/src/features/finance/hooks/useBillingPlans";
import { useBulkMembers, useOrganization } from "@web/src/features/organization";
import {
    Alert,
    App,
    Button,
    Card,
    Collapse,
    Divider,
    Modal,
    Radio,
    Select,
    Space,
    Spin,
    Statistic,
    Typography,
    theme,
    Upload,
} from "antd";
import type React from "react";
import { useMemo, useState } from "react";

const { Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { Panel } = Collapse;

export const MemberImportExportPage: React.FC = () => {
    const { notification } = App.useApp();
    const { activeOrganization } = useOrganization();
    const { token } = theme.useToken();
    const { exportMembers, importMembers, isImporting, importResult } = useBulkMembers(
        activeOrganization?.id
    );
    const [parsedMembers, setParsedMembers] = useState<any[] | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [selectedBillingPlanId, setSelectedBillingPlanId] = useState<string | undefined>();
    const [billingPlanConflict, setBillingPlanConflict] = useState<"replace" | "skip">("replace");
    const {
        data: billingPlansQuery,
        isLoading: isLoadingBillingPlans,
        isError: isBillingPlansError,
        error: billingPlansError,
    } = useBillingPlans(activeOrganization?.id ?? "", {
        limit: 100,
    });
    const billingPlans = useMemo(() => billingPlansQuery?.data ?? [], [billingPlansQuery?.data]);
    const activeBillingPlans = useMemo(
        () => billingPlans.filter((plan) => plan.isActive),
        [billingPlans]
    );
    const hasActiveBillingPlans = activeBillingPlans.length > 0;
    const billingPlanOptions = useMemo(
        () =>
            activeBillingPlans.map((plan) => ({
                label: `${plan.name} (${plan.currencyId})`,
                value: plan.id,
            })),
        [activeBillingPlans]
    );

    const notifyUploadBlocked = () => {
        if (isLoadingBillingPlans) {
            notification.info({
                message: "Loading billing plans",
                description: "Wait a moment for billing plans to finish loading, then try again.",
            });
            return;
        }
        if (isBillingPlansError) {
            notification.error({
                message: "Could not load billing plans",
                description:
                    billingPlansError instanceof Error
                        ? billingPlansError.message
                        : "Refresh the page and try again.",
            });
            return;
        }
        if (!hasActiveBillingPlans) {
            notification.warning({
                message: "Active billing plan required",
                description:
                    "Create and activate at least one billing plan under Admin → Finance → Plans before importing members.",
                duration: 8,
            });
        }
    };

    const handleUpload = (file: File) => {
        if (isImporting || isLoadingBillingPlans || !hasActiveBillingPlans) {
            notifyUploadBlocked();
            return false;
        }

        if (!file.name.toLowerCase().endsWith(".json")) {
            notification.error({
                message: "Unsupported file type",
                description: "Please upload a .json member export file.",
            });
            return false;
        }

        const reader = new FileReader();
        reader.onerror = () => {
            notification.error({
                message: "Could not read file",
                description:
                    "The selected file could not be read. Try exporting again or pick another file.",
            });
        };
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== "string" || text.trim().length === 0) {
                    throw new Error("File is empty");
                }
                const json = JSON.parse(text);
                const members = normalizeBulkMembersRaw(json);
                if (members.length === 0) {
                    notification.warning({
                        message: "No members found",
                        description: "The JSON file is a valid array, but it contains no members.",
                    });
                    return;
                }
                setParsedMembers(members);
                setSelectedBillingPlanId(undefined);
                setBillingPlanConflict("replace");
                setIsReviewOpen(true);
                notification.success({
                    message: "File ready to import",
                    description: `Loaded ${members.length} member row(s). Confirm billing settings to continue.`,
                });
            } catch (err) {
                const description =
                    err instanceof Error
                        ? err.message
                        : "The file must be a JSON array of members.";
                notification.error({
                    message: "Invalid import file",
                    description,
                    duration: 8,
                });
            }
        };
        reader.readAsText(file);
        return false; // Prevent auto-upload by AntD
    };

    const handleConfirmImport = async () => {
        if (!parsedMembers?.length) {
            notification.warning({
                message: "Nothing to import",
                description: "Upload a member JSON file first.",
            });
            return;
        }
        if (!selectedBillingPlanId) {
            notification.warning({
                message: "Billing plan required",
                description: "Select a default billing plan before starting the import.",
            });
            return;
        }
        try {
            await importMembers({
                members: parsedMembers,
                importOptions: {
                    defaultBillingPlanId: selectedBillingPlanId,
                    billingPlanConflict,
                },
            });
            setIsReviewOpen(false);
            setParsedMembers(null);
        } catch {
            // Error toast is handled by the import mutation onError.
        }
    };

    const importExample = [
        {
            id: "user_123",
            email: "jane.doe@example.com",
            name: "Jane Doe",
            role: "student",
            avatarUrl: "https://example.com/avatar.jpg",
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
            profile: {
                id: "prof_123",
                firstName: "Jane",
                lastName: "Doe",
                displayName: "JaneD",
                sex: "female",
                birthDate: "1985-05-15",
                createdAt: "2023-01-01T00:00:00Z",
                updatedAt: "2023-01-01T00:00:00Z",
            },
            phones: [
                {
                    id: "phone_123",
                    countryCode: "+1",
                    number: "5551234",
                    extension: "101",
                    label: "Mobile",
                    isPrimary: true,
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            ],
            addresses: [
                {
                    id: "addr_123",
                    country: "USA",
                    state: "NY",
                    city: "New York",
                    zip: "10001",
                    address: "123 Broadway",
                    label: "Home",
                    isPrimary: true,
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            ],
            socials: [
                {
                    id: "soc_123",
                    type: "LinkedIn",
                    urlOrHandle: "https://linkedin.com/in/janedoe",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            ],
        },
    ];

    const uploadBlocked = isLoadingBillingPlans || !hasActiveBillingPlans;

    return (
        <div>
            <PageHeader
                title="Bulk Member Management"
                subtitle="Import and export member data directly via JSON files."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card title="Export Data" className="shadow-sm">
                    <Paragraph>
                        Download all organization members, including identities and profiles, as a
                        single JSON file.
                    </Paragraph>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={exportMembers}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Export Members JSON
                    </Button>
                </Card>

                <Card title="Import Data" className="shadow-sm">
                    {isLoadingBillingPlans && (
                        <Alert
                            type="info"
                            showIcon
                            className="mb-3"
                            message="Loading billing plans…"
                            description="Import is unavailable until billing plans finish loading."
                        />
                    )}
                    {isBillingPlansError && (
                        <Alert
                            type="error"
                            showIcon
                            className="mb-3"
                            message="Could not load billing plans"
                            description="Refresh the page or check that you have finance access for this organization."
                        />
                    )}
                    {!isLoadingBillingPlans && !isBillingPlansError && !hasActiveBillingPlans && (
                        <Alert
                            type="warning"
                            showIcon
                            className="mb-3"
                            message="No active billing plans found"
                            description="Create and activate at least one billing plan before importing members."
                        />
                    )}
                    <Paragraph>
                        Upload a JSON file to bulk-add or update members.{" "}
                        <Text strong>No automated emails will be sent.</Text>
                    </Paragraph>
                    <Spin spinning={isLoadingBillingPlans || isImporting}>
                        <Dragger
                            accept=".json,application/json"
                            beforeUpload={handleUpload}
                            showUploadList={false}
                            disabled={isImporting}
                        >
                            <Paragraph className="ant-upload-drag-icon">
                                <UploadOutlined className="text-blue-500" />
                            </Paragraph>
                            <Paragraph className="ant-upload-text">
                                Click or drag JSON file to this area to import
                            </Paragraph>
                            {uploadBlocked && (
                                <Paragraph type="secondary" className="ant-upload-hint">
                                    {isLoadingBillingPlans
                                        ? "Waiting for billing plans…"
                                        : "Requires an active billing plan"}
                                </Paragraph>
                            )}
                        </Dragger>
                    </Spin>
                </Card>
            </div>

            <Card className="shadow-sm mb-8" title="Instructions & Schema">
                <Space direction="vertical" size="middle" className="w-full">
                    <Alert
                        message="Quiet Import Mode & Role Enforcement"
                        description="All members are imported silently (no welcome emails). For security, all imported users are set to the 'student' role by default. You can manually upgrade them to 'admin' or 'owner' in the dashboard after the import."
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                    />

                    <Collapse ghost>
                        <Panel header="View JSON Structure Example" key="1">
                            <Paragraph
                                copyable={{ text: JSON.stringify(importExample, null, 2) }}
                                style={{
                                    background: "rgba(0, 0, 0, 0.02)",
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(0, 0, 0, 0.06)",
                                    marginBottom: 0,
                                }}
                            >
                                <pre className="bg-transparent p-0 m-0 text-xs overflow-auto font-mono">
                                    {JSON.stringify(importExample, null, 2)}
                                </pre>
                            </Paragraph>
                        </Panel>
                    </Collapse>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                            <Text strong>Required Fields:</Text>
                            <ul className="list-disc pl-5 mt-2 text-gray-600 dark:text-gray-400">
                                <li>
                                    <code className="text-red-500">email</code> (String)
                                </li>
                                <li>
                                    <code className="text-red-500">name</code> (String)
                                </li>
                            </ul>
                        </div>
                        <div>
                            <Text strong>Optional Fields:</Text>
                            <ul className="list-disc pl-5 mt-2 text-gray-600 dark:text-gray-400">
                                <li>
                                    <code>id</code> (String, preserves system identifier)
                                </li>
                                <li>
                                    <code>avatarUrl</code> (String)
                                </li>
                                <li>
                                    <code>role</code> (Defaults to 'student' for security; can be
                                    changed later)
                                </li>
                                <li>
                                    <code>createdAt</code> / <code>updatedAt</code> (ISO Timestamps)
                                </li>
                                <li>
                                    <code>profile</code> (id, firstName, lastName, displayName, sex,
                                    birthDate, timestamps)
                                </li>
                                <li>
                                    <code>phones</code> (Array of{" "}
                                    {`{ id, countryCode, number, extension, label, isPrimary, timestamps }`}
                                    )
                                </li>
                                <li>
                                    <code>addresses</code> (Array of{" "}
                                    {`{ id, country, state, city, zip, address, label, isPrimary, timestamps }`}
                                    )
                                </li>
                                <li>
                                    <code>socials</code> (Array of{" "}
                                    {`{ id, type, urlOrHandle, timestamps }`})
                                </li>
                            </ul>
                        </div>
                    </div>
                </Space>
            </Card>

            {importResult && (
                <Card title="Latest Import Result" className="shadow-sm border-blue-200">
                    <Space direction="vertical" className="w-full">
                        <div className="flex gap-4">
                            <Statistic
                                title="Processed"
                                value={importResult.total}
                                valueStyle={{ fontSize: token.fontSizeXL }}
                            />
                        </div>
                        <Text type="secondary">
                            Membership and financial setup counters are independent and may not sum
                            to total processed rows.
                        </Text>
                        <Divider style={{ margin: "8px 0" }} />
                        <Text strong>Membership</Text>
                        <div className="flex gap-4">
                            <Statistic
                                title="Created"
                                value={importResult.created}
                                valueStyle={{ color: "#3f8600", fontSize: token.fontSizeXL }}
                                prefix={<CheckCircleOutlined />}
                            />
                            <Statistic
                                title="Linked"
                                value={importResult.linked}
                                valueStyle={{ color: "#108ee9", fontSize: token.fontSizeXL }}
                            />
                            <Statistic
                                title="Failed"
                                value={importResult.failed}
                                valueStyle={{ color: "#cf1322", fontSize: token.fontSizeXL }}
                                prefix={<ExclamationCircleOutlined />}
                            />
                        </div>
                        <Text strong>Financial Setup</Text>
                        <Text type="secondary">
                            Wallets Init counts newly created wallets only. Existing wallets count
                            as 0 even when provisioning checks run.
                        </Text>
                        <div className="flex gap-4">
                            <Statistic
                                title="Wallets Init"
                                value={importResult.walletInitialized}
                                valueStyle={{ color: "#08979c", fontSize: token.fontSizeXL }}
                            />
                            <Statistic
                                title="Billing Assigned"
                                value={importResult.billingAssigned}
                                valueStyle={{ color: "#722ed1", fontSize: token.fontSizeXL }}
                            />
                            <Statistic
                                title="Billing Skipped"
                                value={importResult.billingSkipped}
                                valueStyle={{ color: "#d48806", fontSize: token.fontSizeXL }}
                            />
                        </div>

                        {importResult.errors.length > 0 && (
                            <>
                                <Divider />
                                <Text type="danger" strong>
                                    Errors:
                                </Text>
                                <ul className="max-h-40 overflow-auto list-disc pl-5 mt-2 text-red-600">
                                    {importResult.errors.map((err, i) => (
                                        <li key={`${err}-${i}`}>{err}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </Space>
                </Card>
            )}

            <Modal
                title="Review Import Settings"
                open={isReviewOpen}
                onCancel={() => setIsReviewOpen(false)}
                onOk={handleConfirmImport}
                okText="Start Import"
                okButtonProps={{
                    loading: isImporting,
                    disabled:
                        !selectedBillingPlanId || !hasActiveBillingPlans || !parsedMembers?.length,
                }}
            >
                <Space direction="vertical" className="w-full" size="middle">
                    <Alert
                        type="info"
                        showIcon
                        message={`Rows ready: ${parsedMembers?.length ?? 0}`}
                        description="Review and confirm these settings before import."
                    />
                    {!hasActiveBillingPlans && (
                        <Alert
                            type="warning"
                            showIcon
                            message="No active billing plan available"
                            description="Create an active billing plan, then reopen this import."
                        />
                    )}
                    <div>
                        <Text strong>Default billing plan</Text>
                        <Select
                            className="w-full mt-2"
                            placeholder="Select billing plan"
                            value={selectedBillingPlanId}
                            options={billingPlanOptions}
                            onChange={setSelectedBillingPlanId}
                            status={!selectedBillingPlanId ? "warning" : undefined}
                        />
                        {!selectedBillingPlanId && (
                            <Text type="secondary" className="text-xs mt-1 block">
                                Choose a plan to enable Start Import.
                            </Text>
                        )}
                    </div>
                    <div>
                        <Text strong>If member already has a billing plan</Text>
                        <Radio.Group
                            className="mt-2"
                            value={billingPlanConflict}
                            onChange={(event) => setBillingPlanConflict(event.target.value)}
                        >
                            <Space direction="vertical">
                                <Radio value="replace">Replace existing plan (recommended)</Radio>
                                <Radio value="skip">Keep existing plan</Radio>
                            </Space>
                        </Radio.Group>
                    </div>
                </Space>
            </Modal>
        </div>
    );
};
