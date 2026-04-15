import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { Button } from "antd";
import type React from "react";
import { useState } from "react";
import { PlaylistManager } from "./components/PlaylistManager";

export const OrganizationPlaylistsPage: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Curated Playlists"
                subtitle="Organize your media assets into sequential delivery tracks."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateModalOpen(true)}
                        size="large"
                        className="h-11 font-semibold transition-all duration-200"
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
        </div>
    );
};
