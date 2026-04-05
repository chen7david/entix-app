import { PageHeader } from "@web/src/components/layout/PageHeader";
import type React from "react";
import { MediaLibraryTable } from "./components/MediaLibraryTable";

export const OrganizationMediaPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Media Library"
                subtitle="Upload and manage your organization's video and audio assets."
            />
            <div className="flex-1 min-h-0">
                <MediaLibraryTable />
            </div>
        </div>
    );
};
