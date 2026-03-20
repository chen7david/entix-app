import React from 'react';
import { Typography } from 'antd';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { MediaLibraryTable } from './components/MediaLibraryTable';

const { Title, Text } = Typography;

export const OrganizationAudioPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="!mb-1">Audio Library</Title>
                        <Text type="secondary">Upload and manage your organization's sonic tracks and podcasts.</Text>
                    </div>
                </div>
                <MediaLibraryTable type="audio" />
            </div>
        </>
    );
};
