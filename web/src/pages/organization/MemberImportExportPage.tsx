import {
    CheckCircleOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useBulkMembers } from "@web/src/hooks/api/bulk-members.hooks";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Alert, Button, Card, Collapse, Divider, Space, Statistic, Typography, Upload } from "antd";
import type React from "react";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Panel } = Collapse;

export const MemberImportExportPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const { exportMembers, importMembers, isImporting, importResult } = useBulkMembers(
        activeOrganization?.id
    );

    const handleUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (!Array.isArray(json)) {
                    throw new Error("JSON must be an array of members");
                }
                await importMembers(json);
            } catch (err) {
                console.error(err);
                // AntD message handled by hook manually or via try/catch here if needed
            }
        };
        reader.readAsText(file);
        return false; // Prevent auto-upload by AntD
    };

    const importExample = [
        {
            id: "user_123",
            email: "jane.doe@example.com",
            name: "Jane Doe",
            role: "member",
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
            phoneNumbers: [
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
            socialMedia: [
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

    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-8">
                    <Title level={2}>Bulk Member Management</Title>
                    <Text type="secondary">
                        Import and export member data directly via JSON files.
                    </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card title="Export Data" className="shadow-sm">
                        <Paragraph>
                            Download all organization members, including identities and profiles, as
                            a single JSON file.
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
                        <Paragraph>
                            Upload a JSON file to bulk-add or update members.{" "}
                            <Text strong>No automated emails will be sent.</Text>
                        </Paragraph>
                        <Dragger
                            accept=".json"
                            beforeUpload={handleUpload}
                            showUploadList={false}
                            disabled={isImporting}
                        >
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined className="text-blue-500" />
                            </p>
                            <p className="ant-upload-text">
                                Click or drag JSON file to this area to import
                            </p>
                        </Dragger>
                    </Card>
                </div>

                <Card className="shadow-sm mb-8" title="Instructions & Schema">
                    <Space direction="vertical" size="middle" className="w-full">
                        <Alert
                            message="Quiet Import Mode & Role Enforcement"
                            description="All members are imported silently (no welcome emails). For security, all imported users are set to the 'member' role by default. You can manually upgrade them to 'admin' or 'owner' in the dashboard after the import."
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
                                        <code>role</code> (Defaults to 'member' for security; can be
                                        changed later)
                                    </li>
                                    <li>
                                        <code>createdAt</code> / <code>updatedAt</code> (ISO
                                        Timestamps)
                                    </li>
                                    <li>
                                        <code>profile</code> (id, firstName, lastName, displayName,
                                        sex, birthDate, timestamps)
                                    </li>
                                    <li>
                                        <code>phoneNumbers</code> (Array of{" "}
                                        {`{ id, countryCode, number, extension, label, isPrimary, timestamps }`}
                                        )
                                    </li>
                                    <li>
                                        <code>addresses</code> (Array of{" "}
                                        {`{ id, country, state, city, zip, address, label, isPrimary, timestamps }`}
                                        )
                                    </li>
                                    <li>
                                        <code>socialMedia</code> (Array of{" "}
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
                                <Statistic title="Processed" value={importResult.total} />
                                <Statistic
                                    title="Created"
                                    value={importResult.created}
                                    valueStyle={{ color: "#3f8600" }}
                                    prefix={<CheckCircleOutlined />}
                                />
                                <Statistic
                                    title="Linked"
                                    value={importResult.linked}
                                    valueStyle={{ color: "#108ee9" }}
                                />
                                <Statistic
                                    title="Failed"
                                    value={importResult.failed}
                                    valueStyle={{ color: "#cf1322" }}
                                    prefix={<ExclamationCircleOutlined />}
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
            </div>
        </>
    );
};
