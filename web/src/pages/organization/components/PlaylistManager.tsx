import React, { useState } from 'react';
import { Typography, Button, Table, Avatar, Space, Modal, Form, Input, Drawer, Popconfirm, List } from 'antd';
import { PlusOutlined, DeleteOutlined, OrderedListOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { usePlaylists } from '@web/src/hooks/organization/usePlaylists';
import { useMedia } from '@web/src/hooks/organization/useMedia';

const { Title, Text } = Typography;

export const PlaylistManager: React.FC = () => {
    const { 
        playlists, 
        isLoadingPlaylists, 
        createPlaylist, 
        deletePlaylist, 
        getSequence, 
        updateSequence 
    } = usePlaylists();
    
    const { media } = useMedia();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activePlaylist, setActivePlaylist] = useState<any>(null);
    const [isSequenceDrawerOpen, setIsSequenceDrawerOpen] = useState(false);
    const [sequenceItems, setSequenceItems] = useState<string[]>([]);

    const handleCreateFinish = async (values: any) => {
        await createPlaylist(values);
        setIsCreateModalOpen(false);
    };

    const openSequenceManager = async (playlist: any) => {
        setActivePlaylist(playlist);
        const seq = await getSequence(playlist.id);
        setSequenceItems(seq.map(item => item.mediaId));
        setIsSequenceDrawerOpen(true);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newSeq = [...sequenceItems];
        [newSeq[index - 1], newSeq[index]] = [newSeq[index], newSeq[index - 1]];
        setSequenceItems(newSeq);
    };

    const handleMoveDown = (index: number) => {
        if (index === sequenceItems.length - 1) return;
        const newSeq = [...sequenceItems];
        [newSeq[index + 1], newSeq[index]] = [newSeq[index], newSeq[index + 1]];
        setSequenceItems(newSeq);
    };

    const handleRemoveFromSequence = (mediaIdToRemove: string) => {
        setSequenceItems(prev => prev.filter(id => id !== mediaIdToRemove));
    };

    const handleAddMedia = (mediaId: string) => {
        if (!sequenceItems.includes(mediaId)) {
            setSequenceItems(prev => [...prev, mediaId]);
        }
    };

    const handleSaveSequence = async () => {
        if (activePlaylist) {
            await updateSequence(activePlaylist.id, sequenceItems);
            setIsSequenceDrawerOpen(false);
        }
    };

    const columns = [
        {
            title: 'Playlist',
            key: 'title',
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <Avatar 
                        shape="square" 
                        size="large"
                        className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border border-indigo-100 dark:border-indigo-800/30"
                    >
                        {record.title.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{record.title}</span>
                        <Text type="secondary" className="text-xs">{record.description || 'No description'}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button 
                        type="default" 
                        icon={<OrderedListOutlined />} 
                        onClick={() => openSequenceManager(record)}
                    >
                        Manage Sequence
                    </Button>
                    <Popconfirm
                        title="Delete Playlist"
                        description="Are you sure you want to delete this playlist?"
                        onConfirm={() => deletePlaylist(record.id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6 pt-4">
            <div className="flex justify-between items-center">
                <Text type="secondary">Curate your media into stunning, sequenced playlists.</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
                    New Playlist
                </Button>
            </div>

            <Table
                dataSource={playlists}
                columns={columns}
                rowKey="id"
                loading={isLoadingPlaylists}
                pagination={{ pageSize: 10 }}
            />

            {/* Create Modal */}
            <Modal
                title="Create Segment"
                open={isCreateModalOpen}
                onCancel={() => setIsCreateModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" onFinish={handleCreateFinish}>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please input the title' }]}>
                        <Input placeholder="E.g., Onboarding VODs" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="A brief overview of this playlist..." rows={4} />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Button type="primary" htmlType="submit">Create Playlist</Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Sequence Drawer */}
            <Drawer
                title={`Sequencing: ${activePlaylist?.title}`}
                placement="right"
                onClose={() => setIsSequenceDrawerOpen(false)}
                open={isSequenceDrawerOpen}
                width={600}
                destroyOnClose
                extra={
                    <Button type="primary" onClick={handleSaveSequence}>Save Order</Button>
                }
            >
                <div className="flex flex-col gap-8">
                    {/* Current Sequence */}
                    <div>
                        <Title level={5} className="!mb-4">Current Sequence</Title>
                        {sequenceItems.length === 0 ? (
                            <Text type="secondary">No media added yet.</Text>
                        ) : (
                            <List
                                dataSource={sequenceItems}
                                renderItem={(mediaId, index) => {
                                    const mediaItem = media.find(m => m.id === mediaId);
                                    if (!mediaItem) return null;
                                    
                                    return (
                                        <List.Item
                                            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg flex items-center p-3 mb-2 shadow-sm"
                                            actions={[
                                                <Space direction="horizontal" size="small">
                                                    <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => handleMoveUp(index)} />
                                                    <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={index === sequenceItems.length - 1} onClick={() => handleMoveDown(index)} />
                                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveFromSequence(mediaId)} />
                                                </Space>
                                            ]}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar shape="square" src={mediaItem.coverArtUrl} />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{mediaItem.title}</span>
                                                    <span className="text-xs text-secondary capitalize">{mediaItem.mimeType.split('/')[0]}</span>
                                                </div>
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        )}
                    </div>

                    {/* Available Media Block */}
                    <div>
                        <Title level={5} className="!mb-4">Available Library</Title>
                        <List
                            dataSource={media.filter(m => !sequenceItems.includes(m.id))}
                            renderItem={(item) => (
                                <List.Item
                                    className="p-3 border-b border-gray-100 dark:border-zinc-800"
                                    actions={[
                                        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => handleAddMedia(item.id)}>
                                            Add to sequence
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar shape="square" src={item.coverArtUrl} />}
                                        title={<span className="text-sm font-medium">{item.title}</span>}
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                </div>
            </Drawer>
        </div>
    );
};
