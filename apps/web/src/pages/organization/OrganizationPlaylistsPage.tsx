import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { PlaylistManager } from "@web/src/features/media/components/PlaylistManager";
import { Button } from "antd";
import type React from "react";
import { useState } from "react";

export const OrganizationPlaylistsPage: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <PageShell>
            <PageHeader
                title="Curated Playlists"
                subtitle="Organize your media assets into sequential delivery tracks."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateModalOpen(true)}
                        size="large"
                    >
                        New Playlist
                    </Button>
                }
            />
            <div className="flex-1 min-h-0">
                <PlaylistManager
                    externalIsCreateModalOpen={isCreateModalOpen}
                    onCloseCreateModal={() => setIsCreateModalOpen(false)}
                />
            </div>
        </PageShell>
    );
};
