import {
    ArrowLeftOutlined,
    AudioOutlined,
    InteractionOutlined,
    MenuUnfoldOutlined,
    PlaySquareOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
// useOrganization import removed
import { MediaPlayer, usePlaylist, usePlaylistSequence } from "@web/src/features/media";
import { useOrgNavigate } from "@web/src/features/organization";
import { Button, List, Skeleton, Switch, Tooltip, Typography, theme } from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { CenteredResult, CenteredSpin } from "../../components/common/CenteredView";

const { Title, Text } = Typography;

export const PlaylistPlayerPage: React.FC = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigateOrg = useOrgNavigate();
    const location = useLocation();

    const isTeachingContext = location.pathname.includes("/teaching/");
    const backRoute = isTeachingContext
        ? AppRoutes.org.teaching.playlists
        : AppRoutes.org.admin.playlists;

    const { data: activePlaylist, isLoading: loadingPlaylist } = usePlaylist(playlistId);
    const { token } = theme.useToken();

    const { data: sequence = [], isLoading: isLoadingSequence } = usePlaylistSequence(playlistId);

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [isShuffle, setIsShuffle] = useState(false);

    // biome-ignore lint/correctness/useExhaustiveDependencies: playlistId is the trigger, setCurrentIndex is stable
    useEffect(() => {
        setCurrentIndex(0);
    }, [playlistId]);

    const isLoading = loadingPlaylist || isLoadingSequence;

    if (loadingPlaylist) {
        return <CenteredSpin tip="Loading playlist..." />;
    }

    if (!activePlaylist) {
        return (
            <CenteredResult
                status="404"
                title="Playlist Not Found"
                subTitle="The playlist you are looking for does not exist or has been removed."
                extra={
                    <Button type="primary" onClick={() => navigateOrg(backRoute)}>
                        Back to Playlists
                    </Button>
                }
            />
        );
    }

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

    const activeItem = sequence[currentIndex];
    const activeMedia = activeItem?.media ?? null;

    const queueList = (
        <List
            className="w-full"
            dataSource={sequence}
            renderItem={(item, index) => {
                const { media: mediaItem } = item;
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
                        {mediaItem.mimeType.startsWith("video/") ? (
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
                            <Tooltip
                                title={mediaItem.title}
                                placement="topLeft"
                                mouseEnterDelay={0.5}
                            >
                                <Text
                                    className={`truncate block font-medium transition-colors`}
                                    style={{ color: isPlaying ? token.colorPrimary : undefined }}
                                >
                                    {mediaItem.title}
                                </Text>
                            </Tooltip>
                            {mediaItem.description ? (
                                <Text type="secondary" className="text-xs truncate block mt-0.5">
                                    {mediaItem.description}
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
        <div>
            <div className="flex flex-col" style={{ marginBottom: 32 }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigateOrg(backRoute)}
                    className="self-start !px-0 !mb-2 text-gray-500"
                >
                    Back to Playlists
                </Button>
                <Title level={2} style={{ margin: 0 }}>
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
    );
};
