import React, { useState, useRef } from 'react';
import { Typography, Table, Button, Space, Popconfirm, Drawer, Input, Form, Tooltip, Radio } from 'antd';
import { AudioOutlined, DeleteOutlined, SearchOutlined, PlaySquareOutlined } from '@ant-design/icons';
import { MediaDropzone } from './MediaDropzone';
import { MediaPlayer } from '@web/src/components/Media/MediaPlayer';
import { CoverArtUploader } from "@web/src/components/Upload/CoverArtUploader";
import { useMedia } from '@web/src/hooks/organization/useMedia';
import type { Media } from '@shared/db/schema';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { UI_CONSTANTS } from '@web/src/utils/constants';

const { Title, Text } = Typography;

interface MediaLibraryTableProps {
    defaultType?: "all" | "video" | "audio";
}

export const MediaLibraryTable: React.FC<MediaLibraryTableProps> = ({ defaultType = "all" }) => {
    const [filterType, setFilterType] = useState<"all" | "video" | "audio">(defaultType);
    const [searchText, setSearchText] = useState('');
    
    const [debouncedSearch, control] = useDebouncedValue(
        searchText,
        { wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE },
        (state) => ({ isPending: state.isPending })
    );

    const { media, isLoadingMedia, deleteMedia, recordPlay, updateMedia, isUpdating, fetchNextPage, hasNextPage, isFetchingNextPage } = useMedia(filterType === "all" ? undefined : filterType, debouncedSearch);
    
    const [activeMedia, setActiveMedia] = useState<Media | null>(null);
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
                            description="This will permanently delete the file."
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
            <MediaDropzone type="all" />

            <div className="mb-2 flex items-center justify-between">
                <Input
                    placeholder={`Search media...`}
                    prefix={<SearchOutlined />}
                    className="max-w-xs block"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    suffix={control.state.isPending ? <span className="text-xs text-gray-400 italic">typing...</span> : null}
                />
                
                <Radio.Group value={filterType} onChange={e => setFilterType(e.target.value)} optionType="button" buttonStyle="solid">
                     <Radio.Button value="all">All Media</Radio.Button>
                     <Radio.Button value="video">Video</Radio.Button>
                     <Radio.Button value="audio">Audio</Radio.Button>
                </Radio.Group>
            </div>

            <Table
                dataSource={media}
                columns={columns}
                rowKey="id"
                loading={isLoadingMedia}
                pagination={false}
                onRow={(record) => ({
                    onClick: () => handlePlayMedia(record),
                    className: "cursor-pointer"
                })}
            />
            
            {hasNextPage && (
                <div className="flex justify-center mt-4 mb-8">
                    <Button 
                        onClick={() => fetchNextPage()} 
                        loading={isFetchingNextPage}
                    >
                        Load More
                    </Button>
                </div>
            )}

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
                                mimeType={activeMedia.mimeType}
                                onPlay={handleOnPlay}
                            />
                        </div>

                        {/* Interactive Edit Form Container */}
                        <div className="flex flex-col gap-6 px-1">
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
                                            const updatedMedia = await updateMedia(activeMedia.id, { coverArtUploadId: uploadId });
                                            setActiveMedia(updatedMedia);
                                        }}
                                    />
                                </div>
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
    );
};
