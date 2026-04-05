import { PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import type React from "react";
import { useState } from "react";
import { PlaylistManager } from "./components/PlaylistManager";

const { Title, Text } = Typography;

export const OrganizationPlaylistsPage: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Curated Playlists
                    </Title>
                    <Text type="secondary">
                        Organize your media assets into sequential delivery tracks.
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    New Playlist
                </Button>
            </div>
            <PlaylistManager
                externalIsCreateModalOpen={isCreateModalOpen}
                onCloseCreateModal={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
