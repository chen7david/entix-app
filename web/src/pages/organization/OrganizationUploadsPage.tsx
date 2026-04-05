import { CloudUploadOutlined, DatabaseOutlined, FileOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { Uploader, useDeleteUpload, useOrganizationUploads } from "@web/src/features/media";
import { useOrganization } from "@web/src/features/organization";
import { Button, Card, Col, Modal, Row, Skeleton, Statistic, theme } from "antd";
import { useState } from "react";
import { UploadsTable } from "../../features/uploads/components/UploadsTable";

export const OrganizationUploadsPage = () => {
    const { token } = theme.useToken();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { activeOrganization } = useOrganization();

    const { data: uploads, isLoading: loadingUploads } = useOrganizationUploads(
        activeOrganization?.id
    );
    const deleteUploadMutation = useDeleteUpload(activeOrganization?.id);

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: "Delete File",
            content: "Are you sure you want to delete this file? This action cannot be undone.",
            okText: "Delete",
            okType: "danger",
            onOk: () => {
                deleteUploadMutation.mutate(id);
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

    if (loadingUploads) return <Skeleton active />;
    if (!activeOrganization) return <div>Organization not found</div>;

    const totalStorage = (uploads || []).reduce(
        (acc: number, curr) => acc + (curr.fileSize || 0),
        0
    );
    const totalFiles = uploads?.length || 0;

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Files and Uploads"
                subtitle="Manage your organization's storage securely via Direct-to-R2 architecture."
                actions={
                    <Button
                        type="primary"
                        icon={<CloudUploadOutlined />}
                        onClick={() => setIsUploadModalOpen(true)}
                    >
                        Upload Files
                    </Button>
                }
            />

            {/* Stats Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
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

            <div className="flex-1 min-h-0">
                <UploadsTable
                    uploads={uploads || []}
                    onDelete={handleDelete}
                    isDeleting={(id) =>
                        deleteUploadMutation.isPending && deleteUploadMutation.variables === id
                    }
                />
            </div>

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
    );
};
