import {
    AppstoreOutlined,
    AudioOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    MoreOutlined,
    PlaySquareOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import type { Media } from "@shared";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import {
    CoverArtUploader,
    MediaPlayer,
    useMedia,
    useRecordMediaPlay,
} from "@web/src/features/media";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import type { MenuProps } from "antd";
import { Button, Drawer, Dropdown, Form, Input, Tooltip, Typography } from "antd";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { MediaDropzone } from "./MediaDropzone";

const { Title, Text } = Typography;

interface MediaLibraryTableProps {
    defaultType?: "all" | "video" | "audio";
}

export const MediaLibraryTable: React.FC<MediaLibraryTableProps> = ({ defaultType = "all" }) => {
    const [form] = Form.useForm();
    const [filterType, setFilterType] = useState<"all" | "video" | "audio">(defaultType);
    const [searchText, setSearchText] = useState("");

    const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [pageSize, setPageSize] = useState(10);

    const {
        media,
        isLoadingMedia: loading,
        deleteMedia,
        updateMedia,
        isUpdating,
        nextCursor,
        hasNextPage,
    } = useMedia(filterType === "all" ? undefined : filterType, searchText, {
        cursor: currentCursor,
        limit: pageSize,
    });

    const handleNext = useCallback(() => {
        if (nextCursor) {
            setCursorStack((prev) => [...prev, currentCursor || ""]);
            setCurrentCursor(nextCursor);
        }
    }, [nextCursor, currentCursor]);

    const handlePrev = useCallback(() => {
        if (cursorStack.length > 0) {
            const newStack = [...cursorStack];
            const prev = newStack.pop();
            setCursorStack(newStack);
            setCurrentCursor(prev || undefined);
        }
    }, [cursorStack]);

    const [activeMedia, setActiveMedia] = useState<Media | null>(null);

    useEffect(() => {
        if (activeMedia) {
            form.setFieldsValue({
                title: activeMedia.title,
                description: activeMedia.description || "",
            });
        }
    }, [activeMedia, form]);

    const handlePlayMedia = (record: Media) => {
        setActiveMedia(record);
    };

    const onPlaybackStarted = useRecordMediaPlay(activeMedia?.id);

    const handleCloseModal = () => {
        setActiveMedia(null);
    };

    const columns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            width: 300,
            render: (text: string, record: Media) => (
                <div className="flex items-center gap-3">
                    {record.mimeType.startsWith("video/") ? (
                        <PlaySquareOutlined className="text-purple-500 flex-shrink-0" />
                    ) : (
                        <AudioOutlined className="text-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex flex-col flex-1 min-w-0 max-w-[300px]">
                        <Tooltip title={text} placement="topLeft" mouseEnterDelay={0.5}>
                            <span className="font-semibold text-sm truncate text-[#646cff] hover:text-[#747bff] transition-colors block">
                                {text}
                            </span>
                        </Tooltip>
                        <Tooltip
                            title={record.description}
                            placement="topLeft"
                            mouseEnterDelay={0.5}
                        >
                            <span className="text-xs text-gray-500 truncate mt-0.5 block">
                                {record.description || "No description provided"}
                            </span>
                        </Tooltip>
                    </div>
                </div>
            ),
        },
        {
            title: "Plays",
            dataIndex: "playCount",
            key: "playCount",
            width: 100,
            render: (count: number) => <Text className="font-mono">{count.toLocaleString()}</Text>,
        },
    ];

    const totalAssets = media?.length || 0;
    const videoCount = media?.filter((m) => m.mimeType.startsWith("video/")).length || 0;
    const audioCount = media?.filter((m) => m.mimeType.startsWith("audio/")).length || 0;
    const recentCount =
        media?.filter((m) => Date.now() - new Date(m.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000)
            .length || 0;

    return (
        <div className="flex flex-col h-full min-h-0 gap-4 mt-2">
            <SummaryCardsRow
                loading={loading}
                items={[
                    {
                        key: "total",
                        label: "Loaded Media",
                        value: totalAssets,
                        icon: <AppstoreOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "video",
                        label: "Video Files",
                        value: videoCount,
                        icon: <VideoCameraOutlined />,
                        color: "#8b5cf6",
                    },
                    {
                        key: "audio",
                        label: "Audio Files",
                        value: audioCount,
                        icon: <AudioOutlined />,
                        color: "#10b981",
                    },
                    {
                        key: "recent",
                        label: "Recently Added",
                        value: recentCount,
                        icon: <ClockCircleOutlined />,
                        color: "#f59e0b",
                    },
                ]}
            />
            <MediaDropzone type="all" />

            <div className="flex-1 min-h-0">
                <DataTableWithFilters<Media>
                    config={{
                        columns,
                        data: media,
                        loading,
                        onRowClick: handlePlayMedia,
                        filters: [
                            {
                                type: "search",
                                key: "q",
                                placeholder: "Search media...",
                            },
                            {
                                type: "select",
                                key: "type",
                                placeholder: "All Media Types",
                                options: [
                                    { label: "All Media", value: "all" },
                                    { label: "Video", value: "video" },
                                    { label: "Audio", value: "audio" },
                                ],
                            },
                        ],
                        onFiltersChange: (f: Record<string, any>) => {
                            setSearchText(f.q || "");
                            setFilterType(f.type || "all");
                            setCurrentCursor(undefined);
                            setCursorStack([]);
                        },
                        pagination: {
                            hasNextPage,
                            hasPrevPage: cursorStack.length > 0,
                            pageSize: pageSize,
                            onNext: handleNext,
                            onPrev: handlePrev,
                            onPageSizeChange: (s) => {
                                setPageSize(s);
                                setCurrentCursor(undefined);
                                setCursorStack([]);
                            },
                        },
                        actions: (record: Media) => {
                            const items: MenuProps["items"] = [
                                {
                                    key: "play",
                                    label: "Play / Edit",
                                    onClick: () => handlePlayMedia(record),
                                },
                                {
                                    key: "delete",
                                    label: "Delete",
                                    danger: true,
                                    icon: <DeleteOutlined />,
                                    onClick: () => deleteMedia(record.id),
                                },
                            ];
                            return (
                                <Dropdown menu={{ items }} trigger={["click"]}>
                                    <Button type="text" icon={<MoreOutlined />} />
                                </Dropdown>
                            );
                        },
                    }}
                />
            </div>

            <Drawer
                title="Media Details"
                placement="right"
                onClose={handleCloseModal}
                open={!!activeMedia}
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                destroyOnClose
                extra={
                    <Button type="primary" onClick={() => form.submit()} loading={isUpdating}>
                        Save Changes
                    </Button>
                }
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
                                onPlay={onPlaybackStarted}
                            />
                        </div>

                        {/* Interactive Edit Form Container */}
                        <div className="flex flex-col gap-6 px-1">
                            <div className="flex flex-col gap-2">
                                <Title level={5} className="!mb-0">
                                    Edit Metadata
                                </Title>
                                <Text type="secondary" className="mb-4">
                                    Update the details of this media asset seamlessly.
                                </Text>

                                {/* Inline Cover Art Upload Zone */}
                                <div className="flex flex-col mb-4">
                                    <Text className="mb-2 font-medium">Cover Thumbnail</Text>
                                    <CoverArtUploader
                                        organizationId={activeMedia.organizationId}
                                        currentImageUrl={activeMedia.coverArtUrl}
                                        onUploadSuccess={async (uploadId) => {
                                            const updatedMedia = await updateMedia(activeMedia.id, {
                                                coverArtUploadId: uploadId,
                                            });
                                            setActiveMedia(updatedMedia);
                                        }}
                                    />
                                </div>
                            </div>

                            <Form
                                form={form}
                                layout="vertical"
                                initialValues={{
                                    title: activeMedia.title,
                                    description: activeMedia.description || "",
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
                                    rules={[{ required: true, message: "A title is required" }]}
                                >
                                    <Input placeholder="Epic Trailer..." />
                                </Form.Item>

                                <Form.Item name="description" label="Description">
                                    <Input.TextArea
                                        placeholder="Add a description for your viewers..."
                                        rows={4}
                                    />
                                </Form.Item>
                            </Form>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};
