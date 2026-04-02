import {
    CloudUploadOutlined,
    DatabaseOutlined,
    FileOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Uploader, useDeleteUpload, useOrganizationUploads } from "@web/src/features/media";
import { useOrganization } from "@web/src/features/organization";
import { Button, Card, Col, Input, Modal, Row, Skeleton, Statistic, Typography, theme } from "antd";
import { useState } from "react";
import { UploadsTable } from "../../features/uploads/components/UploadsTable";

const { Title, Text } = Typography;

export const OrganizationUploadsPage = () => {
    const { token } = theme.useToken();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const { activeOrganization } = useOrganization();

    const { data: uploads, isLoading: loadingUploads } = useOrganizationUploads(
        activeOrganization?.id
    );
    const deleteUploadMutation = useDeleteUpload(activeOrganization?.id);

    const handleDelete = (uploadId: string) => {
        Modal.confirm({
            title: "Delete File",
            content:
                "Are you sure you want to permanently delete this file? This action cannot be undone.",
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await deleteUploadMutation.mutateAsync(uploadId);
                } catch {
                    // error matched in hook
                }
            },
        });
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    if (loadingUploads) return <Skeleton active className="p-8" />;
    if (!activeOrganization) return <div className="p-8">Organization not found</div>;

    const totalStorage = uploads?.reduce((acc, curr) => acc + curr.fileSize, 0) || 0;
    const totalFiles = uploads?.length || 0;

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Files and Uploads
                        </Title>
                        <Text type="secondary">
                            Manage your organization's storage securely via Direct-to-R2
                            architecture.
                        </Text>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            type="primary"
                            icon={<CloudUploadOutlined />}
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            Upload Files
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <Row gutter={16} className="mb-6">
                    <Col xs={24} sm={12}>
                        <Card shadow-sm="true">
                            <Statistic
                                title="Total Files"
                                value={totalFiles}
                                prefix={<FileOutlined />}
                                valueStyle={{ fontSize: token.fontSizeXL }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Card shadow-sm="true">
                            <Statistic
                                title="Storage Used"
                                value={totalStorage}
                                prefix={<DatabaseOutlined />}
                                valueStyle={{ fontSize: token.fontSizeXL }}
                                formatter={(val) => formatBytes(Number(val))}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search files..."
                        prefix={<SearchOutlined />}
                        className="max-w-xs"
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                <UploadsTable
                    uploads={
                        uploads?.filter((u) =>
                            u.originalName.toLowerCase().includes(searchText.toLowerCase())
                        ) || []
                    }
                    onDelete={handleDelete}
                    isDeleting={(id) =>
                        deleteUploadMutation.isPending && deleteUploadMutation.variables === id
                    }
                />

                <Modal
                    title="Upload Files"
                    open={isUploadModalOpen}
                    onCancel={() => setIsUploadModalOpen(false)}
                    footer={null}
                    width={800}
                    destroyOnClose
                >
                    <div className="mt-4">
                        <Uploader
                            organizationId={activeOrganization.id}
                            onUploadSuccess={() => {
                                // We can optionally close the modal or let the user upload more
                                // setIsUploadModalOpen(false);
                            }}
                        />
                    </div>
                </Modal>
            </div>
        </>
    );
};
