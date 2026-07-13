import { CloudUploadOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { MediaDropzone } from "@web/src/features/media/components/MediaDropzone";
import { MediaLibraryTable } from "@web/src/features/media/components/MediaLibraryTable";
import { Button, Modal } from "antd";
import type React from "react";
import { useState } from "react";

export const OrganizationMediaPage: React.FC = () => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <PageShell>
            <PageHeader
                title="Media Library"
                subtitle="Upload and manage your organization's video and audio assets."
                actions={
                    <Button
                        type="primary"
                        size="large"
                        icon={<CloudUploadOutlined />}
                        onClick={() => setIsUploadOpen(true)}
                    >
                        Upload Media
                    </Button>
                }
            />
            <div className="flex-1 min-h-0">
                <MediaLibraryTable />
            </div>

            <Modal
                title="Upload Media"
                open={isUploadOpen}
                onCancel={() => setIsUploadOpen(false)}
                footer={null}
                width={640}
                destroyOnClose
            >
                <div className="mt-2">
                    <MediaDropzone type="all" />
                </div>
            </Modal>
        </PageShell>
    );
};
