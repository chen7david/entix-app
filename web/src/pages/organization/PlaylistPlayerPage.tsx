import {
    ArrowLeftOutlined,
    AudioOutlined,
    InteractionOutlined,
    MenuUnfoldOutlined,
    PlaySquareOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared/constants/routes";
import { MediaPlayer } from "@web/src/components/Media/MediaPlayer";
// useOrganization import removed
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useOrgNavigate } from "@web/src/hooks/navigation/useOrgNavigate";
import { useMedia } from "@web/src/hooks/organization/useMedia";
import { usePlaylists } from "@web/src/hooks/organization/usePlaylists";
import { Button, List, Skeleton, Switch, Tooltip, Typography, theme } from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const { Title, Text } = Typography;

export const PlaylistPlayerPage: React.FC = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigateOrg = useOrgNavigate();

    // Core Data Context removed
    const { getSequence, playlists } = usePlaylists();
    const { media } = useMedia();
    const { token } = theme.useToken();

    const [sequence, setSequence] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [isShuffle, setIsShuffle] = useState(false);

    const activePlaylist = playlists.find((p) => p.id === playlistId);

    useEffect(() => {
        if (playlistId) {
            setIsLoading(true);
            getSequence(playlistId)
                .then((items) => {
                    // sort by position
                    const sorted = items
                        .sort((a, b) => a.position - b.position)
                        .map((item) => item.mediaId);
                    setSequence(sorted);
                    setCurrentIndex(0);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [playlistId, getSequence]);

    const handleNext = () => {
        if (isShuffle) {
            if (sequence.length > 1) {
                let nextIdx = currentIndex;
                while (nextIdx === currentIndex) {
                    nextIdx = Math.floor(Math.random() * sequence.length);
                }
                setCurrentIndex(nextIdx);
            }
        } else {
            if (currentIndex < sequence.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleMediaEnd = () => {
        if (!isAutoPlay) return;
        handleNext();
    };

    const hasNext = isShuffle ? sequence.length > 1 : currentIndex < sequence.length - 1;
    const hasPrev = currentIndex > 0;

    const activeMediaId = sequence[currentIndex];
    const activeMedia = media.find((m) => m.id === activeMediaId);

    const queueList = (
        <List
            className="w-full"
            dataSource={sequence}
            renderItem={(mediaId, index) => {
                const item = media.find((m) => m.id === mediaId);
                if (!item) return null;

                const isPlaying = index === currentIndex;

                return (
                    <div
                        onClick={() => setCurrentIndex(index)}
                        className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors border-l-4`}
                        style={{
                            backgroundColor: isPlaying ? token.controlItemBgActive : "transparent",
                            borderColor: isPlaying ? token.colorPrimary : "transparent",
                        }}
                        onMouseEnter={(e) => {
                            if (!isPlaying)
                                e.currentTarget.style.backgroundColor = token.colorBgTextHover;
                        }}
                        onMouseLeave={(e) => {
                            if (!isPlaying) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                    >
                        {item.mimeType.startsWith("video/") ? (
                            <PlaySquareOutlined
                                className={`transition-colors`}
                                style={{
                                    color: isPlaying
                                        ? token.colorPrimary
                                        : token.colorTextSecondary,
                                }}
                            />
                        ) : (
                            <AudioOutlined
                                className={`transition-colors`}
                                style={{
                                    color: isPlaying
                                        ? token.colorPrimary
                                        : token.colorTextSecondary,
                                }}
                            />
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                            <Tooltip title={item.title} placement="topLeft" mouseEnterDelay={0.5}>
                                <Text
                                    className={`truncate block font-medium transition-colors`}
                                    style={{ color: isPlaying ? token.colorPrimary : undefined }}
                                >
                                    {item.title}
                                </Text>
                            </Tooltip>
                            {item.description ? (
                                <Text type="secondary" className="text-xs truncate block mt-0.5">
                                    {item.description}
                                </Text>
                            ) : (
                                <Text
                                    type="secondary"
                                    className="text-xs truncate block mt-0.5 italic opacity-50"
                                >
                                    No description
                                </Text>
                            )}
                        </div>
                    </div>
                );
            }}
        />
    );

    return (
        <>
            <Toolbar />

            <div className="p-6">
                <div className="flex flex-col mb-6">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigateOrg(AppRoutes.org.manage.playlists)}
                        className="self-start !px-0 !mb-2 text-gray-500"
                    >
                        Back to Playlists
                    </Button>
                    <Title level={2} className="!mb-1">
                        {activePlaylist?.title || "Playlist Player"}
                    </Title>
                    <Text type="secondary">
                        {activePlaylist?.description || "Seamless edge delivery playback sequence."}
                    </Text>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-[70%] flex flex-col">
                        <div className="aspect-video w-full bg-black flex items-center justify-center overflow-hidden z-10">
                            {isLoading ? (
                                <Skeleton.Image className="w-full h-full opacity-20" active />
                            ) : activeMedia ? (
                                <MediaPlayer
                                    key={activeMedia.id}
                                    title={activeMedia.title}
                                    description={activeMedia.description || undefined}
                                    mediaUrl={activeMedia.mediaUrl}
                                    coverArtUrl={activeMedia.coverArtUrl || undefined}
                                    mimeType={activeMedia.mimeType}
                                    onEnd={handleMediaEnd}
                                    autoPlay={isAutoPlay}
                                    onNext={hasNext ? handleNext : undefined}
                                    onPrevious={hasPrev ? handlePrev : undefined}
                                />
                            ) : (
                                <Text className="text-white opacity-50">
                                    No media found in sequence
                                </Text>
                            )}
                        </div>
                        <div className="mt-5 px-1">
                            <Title level={4} className="!mb-1">
                                {activeMedia?.title || "Unknown Asset"}
                            </Title>
                            <Text type="secondary">
                                {activeMedia?.description || "No description provided."}
                            </Text>
                        </div>
                    </div>

                    <div
                        className="w-full lg:w-[30%] flex flex-col shadow-sm h-[calc(100vh-240px)]"
                        style={{
                            backgroundColor: token.colorBgContainer,
                            border: `1px solid ${token.colorSplit}`,
                        }}
                    >
                        <div
                            className="px-5 py-4 flex flex-col"
                            style={{ borderBottom: `1px solid ${token.colorSplit}` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Title level={5} className="!mb-0 flex items-center gap-2">
                                    <MenuUnfoldOutlined className="text-gray-500" />
                                    Up Next
                                </Title>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Text
                                        type="secondary"
                                        className="text-xs font-semibold uppercase tracking-wider"
                                    >
                                        Auto-Play
                                    </Text>
                                    <Switch
                                        size="small"
                                        checked={isAutoPlay}
                                        onChange={setIsAutoPlay}
                                    />
                                </div>
                                <Button
                                    type={isShuffle ? "primary" : "default"}
                                    size="small"
                                    icon={<InteractionOutlined />}
                                    onClick={() => setIsShuffle(!isShuffle)}
                                    className={`rounded-none ${isShuffle ? "" : "text-gray-500"}`}
                                >
                                    Shuffle
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-transparent">
                            {isLoading ? (
                                <div className="p-4">
                                    <Skeleton active paragraph={{ rows: 6 }} />
                                </div>
                            ) : (
                                queueList
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
