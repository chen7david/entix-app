import React, { useState, useRef } from 'react';
import { Typography, Table, Button, Space, Popconfirm, Drawer, Input, Form, Tooltip, Select } from 'antd';
import { AudioOutlined, DeleteOutlined, SearchOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { MediaDropzone } from './MediaDropzone';
import { MediaPlayer } from '@web/src/components/Media/MediaPlayer';
import { CoverArtUploader } from "@web/src/components/Upload/CoverArtUploader";
import { SubtitleManager } from './SubtitleManager';
import { useMedia, type MediaWithRelations } from '@web/src/hooks/organization/useMedia';
import type { Media } from '@shared/db/schema.db';

const { Title, Text } = Typography;

interface MediaLibraryTableProps {
    type: "video" | "audio";
}

export const MediaLibraryTable: React.FC<MediaLibraryTableProps> = ({ type }) => {
    const { media, isLoadingMedia, deleteMedia, recordPlay, updateMedia, isUpdating, updateMetadata, isUpdatingMetadata } = useMedia(type);
    const [activeMedia, setActiveMedia] = useState<MediaWithRelations | null>(null);
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
                    {record.mimeType.startsWith('video/') ? (
                        <PlaySquareOutlined className="text-purple-500 flex-shrink-0" />
                    ) : (
                        <AudioOutlined className="text-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex flex-col flex-1 min-w-0 max-w-[300px]">
                        <Tooltip title={text} placement="topLeft" mouseEnterDelay={0.5}>
                            <span className="font-semibold text-sm truncate text-[#646cff] hover:text-[#747bff] transition-colors block">{text}</span>
                        </Tooltip>
                        <Tooltip title={record.description} placement="topLeft" mouseEnterDelay={0.5}>
                            <span className="text-xs text-gray-500 truncate mt-0.5 block">{record.description || 'No description provided'}</span>
                        </Tooltip>
                    </div>
                </div>
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
                <div onClick={(e) => e.stopPropagation()}>
                    <Space size="middle">
                        <Popconfirm
                            title="Delete Media"
                            description="This will permanently delete the file from Cloudflare R2."
                            onConfirm={(e) => {
                                e?.stopPropagation();
                                deleteMedia(record.id);
                            }}
                            onCancel={(e) => e?.stopPropagation()}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                        >
                            <Button icon={<DeleteOutlined />} danger type="text" onClick={(e) => e.stopPropagation()} />
                        </Popconfirm>
                    </Space>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-4 mt-2">
            <MediaDropzone type={type} />

            <div className="mb-2">
                <Input
                    placeholder={`Search ${type}...`}
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
                pagination={{ pageSize: 15 }}
                onRow={(record) => ({
                    onClick: () => handlePlayMedia(record as MediaWithRelations),
                    className: "cursor-pointer"
                })}
            />

            <Drawer
                title="Media Details"
                placement="right"
                onClose={handleCloseModal}
                open={!!activeMedia}
                width={500}
                destroyOnClose
            >
                {activeMedia && (
                    <div className="flex flex-col pb-6">
                        {/* Edge-to-Edge Cinematic Player */}
                        <div className="-mx-6 -mt-6 mb-6 aspect-video bg-black overflow-hidden z-10">
                            <MediaPlayer
                                title={activeMedia.title}
                                description={activeMedia.description || undefined}
                                mediaUrl={activeMedia.mediaUrl}
                                coverArtUrl={activeMedia.coverArtUrl || undefined}
                                subtitles={activeMedia.subtitles}
                                mimeType={activeMedia.mimeType}
                                onPlay={handleOnPlay}
                            />
                        </div>

                        {/* Interactive Edit Form Container */}
                        <div className="flex flex-col gap-6 px-1">
                            
                            {/* External Subtitle Track Manager */}
                            <SubtitleManager media={activeMedia} organizationId={activeMedia.organizationId} />

                            <div className="flex flex-col gap-2">
                                <Title level={5} className="!mb-0">Edit Metadata</Title>
                                <Text type="secondary" className="mb-4">Update the details of this media asset seamlessly.</Text>
                            </div>

                                <Form
                                    layout="vertical"
                                    initialValues={{
                                        title: activeMedia.title,
                                        description: activeMedia.description || '',
                                        source: activeMedia.metadata?.source || 'manual',
                                        externalLikeCount: activeMedia.metadata?.externalLikeCount || 0,
                                        channelName: activeMedia.metadata?.channelName || '',
                                        tags: activeMedia.metadata?.tags ? JSON.parse(activeMedia.metadata.tags) : [],
                                    }}
                                    onFinish={(values) => {
                                        const coreUpdates = { title: values.title, description: values.description };
                                        const metadataUpdates = {
                                            source: values.source || 'manual',
                                            externalLikeCount: Number(values.externalLikeCount) || 0,
                                            channelName: values.channelName || undefined,
                                            tags: Array.isArray(values.tags) ? values.tags : [],
                                        };

                                        Promise.all([
                                            updateMedia(activeMedia.id, coreUpdates),
                                            updateMetadata(activeMedia.id, metadataUpdates)
                                        ]).then(() => {
                                            setActiveMedia({ 
                                                ...activeMedia, 
                                                ...coreUpdates, 
                                                metadata: { ...activeMedia.metadata, ...metadataUpdates, tags: JSON.stringify(metadataUpdates.tags) } as any 
                                            });
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

                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item name="source" label="Source Origin">
                                        <Select placeholder="e.g. YouTube, Internal...">
                                            <Select.Option value="manual">Manual Upload</Select.Option>
                                            <Select.Option value="youtube">YouTube Sync</Select.Option>
                                            <Select.Option value="vimeo">Vimeo Proxy</Select.Option>
                                            <Select.Option value="other">Other</Select.Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="channelName" label="Channel / Creator">
                                        <Input placeholder="e.g. Vevo, Netflix..." />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item name="externalLikeCount" label="External Likes">
                                        <Input type="number" placeholder="0" />
                                    </Form.Item>
                                    <Form.Item name="tags" label="Tags">
                                        <Select 
                                            mode="tags" 
                                            placeholder="Type and hit enter" 
                                            className="w-full"
                                            tokenSeparators={[',']}
                                        />
                                    </Form.Item>
                                </div>

                                {/* Inline Cover Art Upload Zone */}
                                <div className="flex flex-col mb-6">
                                    <Text className="mb-2 font-medium">Cover Thumbnail</Text>
                                    <CoverArtUploader
                                        organizationId={activeMedia.organizationId}
                                        currentImageUrl={activeMedia.coverArtUrl}
                                        onUploadSuccess={async (uploadId) => {
                                            const updatedMedia = await updateMedia(activeMedia.id, { coverArtUploadId: uploadId });
                                            setActiveMedia(updatedMedia);
                                        }}
                                    />
                                </div>

                                <Form.Item className="mb-0 flex justify-end">
                                    <Button type="primary" htmlType="submit" loading={isUpdating || isUpdatingMetadata}>
                                        Save Changes
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};
