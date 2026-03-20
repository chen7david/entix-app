import React from 'react';
import { MediaPlayer as VidstackPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import '../../../node_modules/@vidstack/react/player/styles/default/theme.css';
import '../../../node_modules/@vidstack/react/player/styles/default/layouts/video.css';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { StepBackwardOutlined, StepForwardOutlined, AudioOutlined } from '@ant-design/icons';

interface MediaPlayerProps {
    title: string;
    description?: string;
    mediaUrl: string;
    coverArtUrl?: string;
    subtitlesUrl?: string;
    mimeType: string;
    onEnd?: () => void;
    onPlay?: () => void;
    autoPlay?: boolean;
    onNext?: () => void;
    onPrevious?: () => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
    title,
    mediaUrl,
    coverArtUrl,
    subtitlesUrl,
    mimeType,
    onEnd,
    onPlay,
    autoPlay = false,
    onNext,
    onPrevious
}) => {
    const isAudio = mimeType.startsWith('audio/');

    // Helper to generate the exact native skip-buttons
    const prevButton = onPrevious ? (
        <button type="button" className="vds-button" onClick={onPrevious} aria-label="Previous Track">
            <StepBackwardOutlined className="text-xl" />
        </button>
    ) : null;

    const nextButton = onNext ? (
        <button type="button" className="vds-button" onClick={onNext} aria-label="Next Track">
            <StepForwardOutlined className="text-xl" />
        </button>
    ) : null;

    const layoutSlots = {
        beforePlayButton: prevButton,
        afterPlayButton: nextButton,
    };

    return (
        <VidstackPlayer
            title={title}
            src={mediaUrl}
            viewType="video" /* Force video view so audio tracks can use the cinematic layout */
            onEnd={onEnd}
            onPlay={onPlay}
            autoPlay={autoPlay}
            playsInline
            className="w-full h-full overflow-hidden relative"
        >
            {isAudio && !coverArtUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 pointer-events-none px-6 text-center -z-10">
                    <AudioOutlined className="text-5xl text-blue-500 mb-4 opacity-50" />
                    <h3 className="text-white text-2xl font-semibold truncate w-full opacity-80">{title}</h3>
                    <p className="text-gray-400 text-sm mt-2 opacity-60">Audio Playback</p>
                </div>
            )}

            <MediaProvider>
                {coverArtUrl && (
                    <Poster
                        className="vds-poster"
                        src={coverArtUrl}
                        alt={`${title} Cover Art`}
                    />
                )}
                {subtitlesUrl && (
                    <Track
                        src={subtitlesUrl}
                        kind="subtitles"
                        label="English"
                        lang="en"
                        default
                    />
                )}
            </MediaProvider>

            <DefaultVideoLayout icons={defaultLayoutIcons} slots={layoutSlots} />
        </VidstackPlayer>
    );
};
