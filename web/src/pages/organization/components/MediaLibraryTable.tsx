import { AudioOutlined, DeleteOutlined, MoreOutlined, PlaySquareOutlined } from "@ant-design/icons";
import type { Media } from "@shared";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { CoverArtUploader, MediaPlayer, useMedia } from "@web/src/features/media";
import type { MenuProps } from "antd";
import { Button, Drawer, Dropdown, Form, Input, Tooltip, Typography } from "antd";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaDropzone } from "./MediaDropzone";

const { Title, Text } = Typography;

interface MediaLibraryTableProps {
    defaultType?: "all" | "video" | "audio";
}

export const MediaLibraryTable: React.FC<MediaLibraryTableProps> = ({ defaultType = "all" }) => {
    const [filterType, setFilterType] = useState<"all" | "video" | "audio">(defaultType);
    const [searchText, setSearchText] = useState("");

    const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
    const [cursorStack, setCursorStack] = useState<string[]>([]);

    const {
        media,
        isLoadingMedia: loading,
        deleteMedia,
        recordPlay,
        updateMedia,
        isUpdating,
        nextCursor,
        hasNextPage,
        hasPrevPage,
    } = useMedia(filterType === "all" ? undefined : filterType, searchText, {
        cursor: currentCursor,
        limit: 10,
    });

    // Reset cursor when filters change
    useEffect(() => {
        setCurrentCursor(undefined);
        setCursorStack([]);
    }, []);

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
    const hasRecordedPlay = useRef<boolean>(false);

    const handlePlayMedia = (record: Media) => {
        hasRecordedPlay.current = false;
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

    return (
        <div className="flex flex-col gap-4 mt-2">
            <MediaDropzone type="all" />

            <div className="h-[calc(100vh-420px)] min-h-[500px]">
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
                                label: "Type",
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
                        },
                        pagination: {
                            hasNextPage,
                            hasPrevPage,
                            pageSize: 10,
                            onNext: handleNext,
                            onPrev: handlePrev,
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
                width={400}
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
