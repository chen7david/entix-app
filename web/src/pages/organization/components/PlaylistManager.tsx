import {
    AudioOutlined,
    DeleteOutlined,
    HolderOutlined,
    OrderedListOutlined,
    PlayCircleOutlined,
    PlaySquareOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppRoutes } from "@shared/constants/routes";
import { CoverArtUploader } from "@web/src/components/Upload/CoverArtUploader";
// useOrganization import removed
import { useOrgNavigate } from "@web/src/hooks/navigation/useOrgNavigate";
import { useMedia } from "@web/src/hooks/organization/useMedia";
import { usePlaylists } from "@web/src/hooks/organization/usePlaylists";
import {
    Button,
    Drawer,
    Empty,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tooltip,
    Typography,
} from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

const SortableItem = ({
    id,
    mediaItem,
    onRemove,
}: {
    id: string;
    mediaItem: any;
    onRemove: () => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between px-4 py-3 mb-3 rounded-xl border ${
                isDragging
                    ? "border-[#646cff] bg-indigo-50 dark:bg-[#646cff]/10 shadow-xl ring-2 ring-[#646cff]/20"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            } transition-all group`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <HolderOutlined />
                </div>
                <div className="flex flex-col flex-1 min-w-0 max-w-[280px]">
                    <Tooltip title={mediaItem.title} placement="topLeft" mouseEnterDelay={0.5}>
                        <span className="font-semibold text-sm truncate block text-[#646cff] dark:text-[#747bff] transition-colors">
                            {mediaItem.title}
                        </span>
                    </Tooltip>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {mediaItem.mimeType.startsWith("audio") ? (
                            <AudioOutlined />
                        ) : (
                            <PlaySquareOutlined />
                        )}
                        <span className="capitalize">{mediaItem.mimeType.split("/")[0]}</span>
                    </div>
                </div>
            </div>
            <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </div>
    );
};

export const PlaylistManager: React.FC<{
    externalIsCreateModalOpen?: boolean;
    onCloseCreateModal?: () => void;
}> = ({ externalIsCreateModalOpen, onCloseCreateModal }) => {
    const {
        playlists,
        isLoadingPlaylists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        getSequence,
        updateSequence,
    } = usePlaylists();

    const { media } = useMedia();
    const navigateOrg = useOrgNavigate();
    // Legacy definition removed since we merged the hook calls

    const [searchText, setSearchText] = useState("");
    const [internalIsCreateModalOpen, setInternalIsCreateModalOpen] = useState(false);
    const isCreateModalOpen = externalIsCreateModalOpen ?? internalIsCreateModalOpen;
    const setIsCreateModalOpen = (val: boolean) => {
        setInternalIsCreateModalOpen(val);
        if (!val && onCloseCreateModal) onCloseCreateModal();
    };
    const [activePlaylist, setActivePlaylist] = useState<any>(null);
    const [isSequenceDrawerOpen, setIsSequenceDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [sequenceItems, setSequenceItems] = useState<string[]>([]);

    const [editForm] = Form.useForm();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCreateFinish = async (values: any) => {
        await createPlaylist(values);
        setIsCreateModalOpen(false);
    };

    const openSequenceManager = async (playlist: any) => {
        setActivePlaylist(playlist);
        const seq = await getSequence(playlist.id);
        setSequenceItems(seq.map((item) => item.mediaId));
        setIsSequenceDrawerOpen(true);
    };

    const openEditDrawer = (playlist: any) => {
        setActivePlaylist(playlist);
        editForm.setFieldsValue({
            title: playlist.title,
            description: playlist.description,
        });
        setIsEditDrawerOpen(true);
    };

    const handleEditSave = async (values: any) => {
        if (activePlaylist) {
            await updatePlaylist(activePlaylist.id, values);
            setIsEditDrawerOpen(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSequenceItems((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newArray = arrayMove(items, oldIndex, newIndex);

                if (activePlaylist) {
                    updateSequence(activePlaylist.id, newArray).catch(console.error);
                }

                return newArray;
            });
        }
    };

    const handleRemoveFromSequence = (mediaIdToRemove: string) => {
        const newItems = sequenceItems.filter((id) => id !== mediaIdToRemove);
        setSequenceItems(newItems);
        if (activePlaylist) {
            updateSequence(activePlaylist.id, newItems).catch(console.error);
        }
    };

    const handleAddMedia = (mediaId: string) => {
        if (!sequenceItems.includes(mediaId)) {
            const newItems = [...sequenceItems, mediaId];
            setSequenceItems(newItems);
            if (activePlaylist) {
                updateSequence(activePlaylist.id, newItems).catch(console.error);
            }
        }
    };

    const columns = [
        {
            title: "Playlist",
            key: "title",
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <OrderedListOutlined className="text-blue-500 flex-shrink-0" />
                    <div className="flex flex-col flex-1 min-w-0 max-w-[300px]">
                        <Tooltip title={record.title} placement="topLeft" mouseEnterDelay={0.5}>
                            <span className="text-[#646cff] hover:text-[#747bff] transition-colors font-semibold truncate block">
                                {record.title}
                            </span>
                        </Tooltip>
                        <Tooltip
                            title={record.description}
                            placement="topLeft"
                            mouseEnterDelay={0.5}
                        >
                            <span className="text-xs font-medium mt-0.5 text-gray-500 truncate block">
                                {record.description || "No description"}
                            </span>
                        </Tooltip>
                    </div>
                </div>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            align: "right" as const,
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button
                        type="default"
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigateOrg(AppRoutes.org.manage.playlistDetail(record.id));
                        }}
                    />
                    <Button
                        type="default"
                        icon={<OrderedListOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            openSequenceManager(record);
                        }}
                    >
                        Manage Sequence
                    </Button>
                    <Popconfirm
                        title="Delete Playlist"
                        description="Are you sure you want to delete this playlist?"
                        onConfirm={(e) => {
                            e?.stopPropagation();
                            deletePlaylist(record.id);
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 pt-4">
            <div className="flex justify-between items-center mb-2">
                <Input
                    placeholder="Search playlists..."
                    prefix={<SearchOutlined />}
                    className="max-w-xs"
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            <Table
                dataSource={playlists?.filter((p: any) =>
                    p.title.toLowerCase().includes(searchText.toLowerCase())
                )}
                columns={columns}
                rowKey="id"
                loading={isLoadingPlaylists}
                pagination={{ pageSize: 10 }}
                rowClassName="cursor-pointer"
                onRow={(record) => ({
                    onClick: () => openEditDrawer(record),
                })}
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
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Please input the title" }]}
                    >
                        <Input placeholder="E.g., Onboarding VODs" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea
                            placeholder="A brief overview of this playlist..."
                            rows={4}
                        />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Button type="primary" htmlType="submit">
                            Create Playlist
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title={`Sequencing: ${activePlaylist?.title}`}
                placement="right"
                onClose={() => setIsSequenceDrawerOpen(false)}
                open={isSequenceDrawerOpen}
                width={400}
                destroyOnClose
            >
                <div className="flex flex-col gap-8 h-full">
                    {/* Add Media AutoComplete Block */}
                    <div>
                        <Title level={5} className="!mb-4">
                            Quick Add Media
                        </Title>
                        <Select
                            showSearch
                            placeholder="Type to search and add media to this playlist..."
                            style={{ width: "100%" }}
                            allowClear
                            size="large"
                            onChange={(value) => handleAddMedia(value as string)}
                            filterOption={(input, option) =>
                                (option?.label ?? "")
                                    .toString()
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                            options={media
                                ?.filter((m: any) => !sequenceItems.includes(m.id))
                                ?.map((m: any) => ({
                                    value: m.id,
                                    label: `${m.title} (${m.mimeType.split("/")[0]})`,
                                }))}
                        />
                    </div>

                    {/* Current Sequence Drag and Drop */}
                    <div className="flex-1 overflow-y-auto pr-2 pb-6">
                        <div className="flex justify-between items-center mb-4">
                            <Title level={5} className="!mb-0">
                                Current Sequence
                            </Title>
                            <Text type="secondary" className="text-xs">
                                {sequenceItems.length} items
                            </Text>
                        </div>

                        {sequenceItems.length === 0 ? (
                            <div className="py-12">
                                <Empty
                                    description={
                                        <>
                                            No media added yet.
                                            <br />
                                            Use the search bar above to add content.
                                        </>
                                    }
                                />
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={sequenceItems}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {sequenceItems.map((mediaId) => {
                                        const mediaItem = media.find((m) => m.id === mediaId);
                                        if (!mediaItem) return null;
                                        return (
                                            <SortableItem
                                                key={mediaId}
                                                id={mediaId}
                                                mediaItem={mediaItem}
                                                onRemove={() => handleRemoveFromSequence(mediaId)}
                                            />
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>
            </Drawer>

            {/* Playlist Edit Drawer */}
            <Drawer
                title={`Edit Playlist`}
                placement="right"
                onClose={() => setIsEditDrawerOpen(false)}
                open={isEditDrawerOpen}
                width={400}
                destroyOnClose
                extra={
                    <Button type="primary" onClick={() => editForm.submit()}>
                        Save Settings
                    </Button>
                }
            >
                {/* Frictionless Cover Art Upload Zone */}
                <div className="flex flex-col mb-6">
                    <Text type="secondary" className="mb-2">
                        Playlist Cover
                    </Text>
                    {activePlaylist && (
                        <CoverArtUploader
                            organizationId={activePlaylist.organizationId}
                            currentImageUrl={activePlaylist.coverArtUrl}
                            onUploadSuccess={async (uploadId) => {
                                const updatedPlaylist = await updatePlaylist(activePlaylist.id, {
                                    coverArtUploadId: uploadId,
                                });
                                setActivePlaylist(updatedPlaylist);
                            }}
                        />
                    )}
                </div>

                <Form form={editForm} layout="vertical" onFinish={handleEditSave} className="mt-2">
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Please input the title" }]}
                    >
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};
