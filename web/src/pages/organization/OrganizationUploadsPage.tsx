import { useState } from "react";
import { Table, Typography, Tag, Skeleton, Button, Tooltip, Modal, Statistic, Row, Col, Card, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CloudUploadOutlined, DeleteOutlined, FileOutlined, DatabaseOutlined, PlaySquareOutlined, PictureOutlined, SearchOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useOrganizationUploads, useDeleteUpload, type Upload } from "@web/src/hooks/organization/useUploads";
import { Uploader } from "@web/src/components/Upload/Uploader";
import { getAssetUrl } from "@shared/utils/image-url";

const { Title, Text } = Typography;

export const OrganizationUploadsPage = () => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const { activeOrganization } = useOrganization();

    const { data: uploads, isLoading: loadingUploads } = useOrganizationUploads(activeOrganization?.id);
    const deleteUploadMutation = useDeleteUpload(activeOrganization?.id);

    const handleDelete = (uploadId: string) => {
        Modal.confirm({
            title: 'Delete File',
            content: 'Are you sure you want to permanently delete this file? This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
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
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith('image/')) return <PictureOutlined className="text-blue-500" />;
        if (contentType.startsWith('video/')) return <PlaySquareOutlined className="text-purple-500" />;
        return <FileOutlined className="text-gray-500" />;
    };

    const columns: ColumnsType<Upload> = [
        {
            title: 'File Name',
            dataIndex: 'originalName',
            key: 'originalName',
            render: (name: string, record: Upload) => (
                <div className="flex items-center gap-3">
                    {getFileIcon(record.contentType)}
                    <a href={getAssetUrl(record.url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">
                        {name}
                    </a>
                </div>
            ),
        },
        {
            title: 'Size',
            dataIndex: 'fileSize',
            key: 'fileSize',
            render: (size: number) => formatBytes(size),
        },
        {
            title: 'Type',
            dataIndex: 'contentType',
            key: 'contentType',
            render: (type: string) => <Tag>{type.split('/')[1] || type}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'processing'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Uploaded At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: number) => new Date(date).toLocaleString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: Upload) => (
                <Tooltip title="Delete File">
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                        loading={deleteUploadMutation.isPending && deleteUploadMutation.variables === record.id}
                    />
                </Tooltip>
            ),
        }
    ];

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
                        <Title level={2} style={{ marginBottom: 4 }}>Files and Uploads</Title>
                        <Text type="secondary">Manage your organization's storage securely via Direct-to-R2 architecture.</Text>
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
                        <Card>
                            <Statistic
                                title="Total Files"
                                value={totalFiles}
                                prefix={<FileOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Card>
                            <Statistic
                                title="Storage Used"
                                value={formatBytes(totalStorage)}
                                prefix={<DatabaseOutlined />}
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
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                <Table
                    dataSource={uploads?.filter(u => u.originalName.toLowerCase().includes(searchText.toLowerCase()))}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />

                <Modal
                    title="Upload Files"
                    open={isUploadModalOpen}
                    onCancel={() => setIsUploadModalOpen(false)}
                    footer={null}
                    width={800}
                    destroyOnHidden
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
