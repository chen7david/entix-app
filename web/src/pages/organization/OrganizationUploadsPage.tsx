import { CloudUploadOutlined, DatabaseOutlined, FileOutlined } from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { Uploader, useDeleteUpload, useOrganizationUploads } from "@web/src/features/media";
import { useOrganization } from "@web/src/features/organization";
import { useCursorTableState } from "@web/src/hooks/useCursorTableState";
import { Button, Modal, Skeleton } from "antd";
import { useState } from "react";
import { UploadsTable } from "../../features/uploads/components/UploadsTable";

export type UploadFilters = {
    search?: string;
    type?: "video" | "audio";
};

export const OrganizationUploadsPage = () => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { activeOrganization } = useOrganization();

    const {
        filters,
        debouncedSearch,
        cursorStack,
        pageSize,
        currentCursor,
        onFiltersChange,
        onPageSizeChange,
        onNext,
        onPrev,
    } = useCursorTableState<UploadFilters>();

    const { data: uploadsResponse, isLoading: loadingUploads } = useOrganizationUploads(
        activeOrganization?.id,
        {
            search: debouncedSearch,
            type: filters.type,
            cursor: currentCursor,
            limit: pageSize,
            direction: "next",
        }
    );
    const uploads = uploadsResponse?.items || [];
    const totalFiles = uploadsResponse?.items.length ?? 0;

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
            <SummaryCardsRow
                items={[
                    {
                        key: "total",
                        label: "Uploads on This Page",
                        value: totalFiles,
                        icon: <FileOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "storage",
                        label: "Storage Used",
                        value: formatBytes(totalStorage),
                        icon: <DatabaseOutlined />,
                        color: "#8b5cf6",
                    },
                ]}
            />

            <div className="flex-1 min-h-0">
                <UploadsTable
                    uploads={uploads}
                    loading={loadingUploads}
                    onDelete={handleDelete}
                    isDeleting={(id) =>
                        deleteUploadMutation.isPending && deleteUploadMutation.variables === id
                    }
                    onFiltersChange={onFiltersChange}
                    pagination={{
                        pageSize,
                        hasNextPage: !!uploadsResponse?.nextCursor,
                        hasPrevPage: cursorStack.length > 0,
                        onNext: () => onNext(uploadsResponse?.nextCursor),
                        onPrev: onPrev,
                        onPageSizeChange: onPageSizeChange,
                    }}
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
