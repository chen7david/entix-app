import React, { useState, useRef } from 'react';
import { Typography, Table, Tag, Button, Space, Popconfirm, Drawer, Input, Form, Tabs } from 'antd';
import { VideoCameraOutlined, AudioOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { MediaDropzone } from './components/MediaDropzone';
import { PlaylistManager } from './components/PlaylistManager';
import { MediaPlayer } from '@web/src/components/Media/MediaPlayer';
import { EntityAvatar } from "@web/src/components/ui/EntityAvatar";
import { CoverArtUploader } from "@web/src/components/Upload/CoverArtUploader";
import { useMedia } from '@web/src/hooks/organization/useMedia';
import type { Media } from '@shared/db/schema.db';

const { Title, Text } = Typography;

export const OrganizationMediaPage: React.FC = () => {
    const { media, isLoadingMedia, deleteMedia, recordPlay, updateMedia, isUpdating } = useMedia();
    const [activeMedia, setActiveMedia] = useState<Media | null>(null);
    const [searchText, setSearchText] = useState('');
    const hasRecordedPlay = useRef<boolean>(false);

    const handlePlayMedia = (record: Media) => {
        hasRecordedPlay.current = false; // Reset lock for new playback session
        setActiveMedia(record);
    };

    const handleOnPlay = () => {
        if (activeMedia && !hasRecordedPlay.current) {
            hasRecordedPlay.current = true;
            recordPlay(activeMedia.id);
        }
    };

    const handleCloseModal = () => {
        setActiveMedia(null);
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Media) => (
                <div className="flex items-center gap-3">
                    <EntityAvatar 
                        imageUrl={record.coverArtUrl || undefined}
                        icon={record.mimeType.startsWith('video/') ? <VideoCameraOutlined /> : <AudioOutlined />}
                        fontSize={16}
                    />
                    <div className="flex flex-col">
                        <Text strong className="text-[#646cff] hover:text-[#747bff] transition-colors">{text}</Text>
                        <Text type="secondary" className="text-xs font-mono">{record.id.split('-')[0]}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Type',
            dataIndex: 'mimeType',
            key: 'mimeType',
            render: (mime: string) => (
                <Tag color={mime.startsWith('video/') ? 'blue' : 'purple'}>
                    {mime.split('/')[1].toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Plays',
            dataIndex: 'playCount',
            key: 'playCount',
            render: (count: number) => <Text className="font-mono">{count.toLocaleString()}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Media) => (
                <Space size="middle">
                    <Popconfirm 
                        title="Delete Media" 
                        description="This will permanently delete the file from Cloudflare R2."
                        onConfirm={() => deleteMedia(record.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button icon={<DeleteOutlined />} danger type="text" />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const items = [
        {
            key: '1',
            label: 'Library Files',
            children: (
                <>
                    <MediaDropzone />

                    <div className="mb-4">
                        <Input
                            placeholder="Search media..."
                            prefix={<SearchOutlined />}
                            className="max-w-xs"
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                        />
                    </div>

                    <Table
                        dataSource={media?.filter((m: Media) => m.title.toLowerCase().includes(searchText.toLowerCase()))}
                        columns={columns}
                        rowKey="id"
                        loading={isLoadingMedia}
                        pagination={{ pageSize: 10 }}
                        onRow={(record) => ({
                            onClick: () => handlePlayMedia(record),
                            className: "cursor-pointer"
                        })}
                    />
                </>
            ),
        },
        {
            key: '2',
            label: 'Curated Playlists',
            children: <PlaylistManager />,
        },
    ];

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="!mb-1">Media Library</Title>
                        <Text type="secondary">Upload and manage your organization's video and audio assets.</Text>
                    </div>
                </div>

                <Tabs defaultActiveKey="1" items={items} />

            <Drawer
                title="Media Details"
                placement="right"
                onClose={handleCloseModal}
                open={!!activeMedia}
                width={500}
                destroyOnClose
            >
                {activeMedia && (
                    <div className="flex flex-col gap-6">
                        {/* Player */}
                        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-sm ring-1 ring-gray-200 dark:ring-zinc-800">
                            <MediaPlayer
                                title={activeMedia.title}
                                description={activeMedia.description || undefined}
                                mediaUrl={activeMedia.mediaUrl}
                                coverArtUrl={activeMedia.coverArtUrl || undefined}
                                mimeType={activeMedia.mimeType}
                                onPlay={handleOnPlay}
                            />
                        </div>

                        {/* Interactive Edit Form */}
                        <div className="flex flex-col gap-2">
                            <Title level={5} className="!mb-0">Edit Metadata</Title>
                            <Text type="secondary" className="mb-4">Update the details of this media asset seamlessly.</Text>

                            {/* Inline Cover Art Upload Zone */}
                            <div className="flex flex-col mb-4">
                                <Text className="mb-2 font-medium">Cover Thumbnail</Text>
                                <CoverArtUploader
                                    organizationId={activeMedia.organizationId}
                                    currentImageUrl={activeMedia.coverArtUrl}
                                    onUploadSuccess={async (uploadId) => {
                                        await updateMedia(activeMedia.id, { coverArtUploadId: uploadId });
                                        // The query invalidation will sync the data across the app.
                                        // To reflect immediately locally, we trigger a close or we can let React Query refetch sync it on the next render
                                    }}
                                />
                            </div>

                            <Form
                                layout="vertical"
                                initialValues={{
                                    title: activeMedia.title,
                                    description: activeMedia.description || '',
                                }}
                                onFinish={(values) => {
                                    updateMedia(activeMedia.id, values).then(() => {
                                        setActiveMedia({ ...activeMedia, ...values });
                                    });
                                }}
                            >
                                <Form.Item
                                    name="title"
                                    label="Title"
                                    rules={[{ required: true, message: 'A title is required' }]}
                                >
                                    <Input placeholder="Epic Trailer..." />
                                </Form.Item>

                                <Form.Item
                                    name="description"
                                    label="Description"
                                >
                                    <Input.TextArea placeholder="Add a description for your viewers..." rows={4} />
                                </Form.Item>

                                <Form.Item className="mb-0 flex justify-end">
                                    <Button type="primary" htmlType="submit" loading={isUpdating}>
                                        Save Changes
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
        </>
    );
};
