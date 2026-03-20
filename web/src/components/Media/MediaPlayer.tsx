import React from 'react';
import { MediaPlayer as VidstackPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import '../../../node_modules/@vidstack/react/player/styles/default/theme.css';
import '../../../node_modules/@vidstack/react/player/styles/default/layouts/video.css';
import '../../../node_modules/@vidstack/react/player/styles/default/layouts/audio.css';
import { defaultLayoutIcons, DefaultVideoLayout, DefaultAudioLayout } from '@vidstack/react/player/layouts/default';
import { StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';

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
            viewType={isAudio ? 'audio' : 'video'}
            onEnd={onEnd}
            onPlay={onPlay}
            autoPlay={autoPlay}
            playsInline
            className="w-full h-full overflow-hidden"
        >
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

            {isAudio ? (
                <DefaultAudioLayout icons={defaultLayoutIcons} slots={layoutSlots} />
            ) : (
                <DefaultVideoLayout icons={defaultLayoutIcons} slots={layoutSlots} />
            )}
        </VidstackPlayer>
    );
};
