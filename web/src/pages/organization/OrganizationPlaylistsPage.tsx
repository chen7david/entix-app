import React, { useState } from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { PlaylistManager } from './components/PlaylistManager';

const { Title, Text } = Typography;

export const OrganizationPlaylistsPage: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="!mb-1">Curated Playlists</Title>
                        <Text type="secondary">Organize your media assets into sequential delivery tracks.</Text>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
                        New Playlist
                    </Button>
                </div>
                <PlaylistManager 
                    externalIsCreateModalOpen={isCreateModalOpen} 
                    onCloseCreateModal={() => setIsCreateModalOpen(false)} 
                />
            </div>
        </>
    );
};
