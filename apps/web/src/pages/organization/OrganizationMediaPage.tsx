import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { MediaLibraryTable } from "@web/src/features/media/components/MediaLibraryTable";
import type React from "react";

export const OrganizationMediaPage: React.FC = () => {
    return (
        <PageShell>
            <PageHeader
                title="Media Library"
                subtitle="Upload and manage your organization's video and audio assets."
            />
            <div className="flex-1 min-h-0">
                <MediaLibraryTable />
            </div>
        </PageShell>
    );
};
