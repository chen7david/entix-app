import React from 'react';
import { MediaPlayer as VidstackPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import '../../../node_modules/@vidstack/react/player/styles/default/theme.css';
import '../../../node_modules/@vidstack/react/player/styles/default/layouts/video.css';
import '../../../node_modules/@vidstack/react/player/styles/default/layouts/audio.css';
import { defaultLayoutIcons, DefaultVideoLayout, DefaultAudioLayout } from '@vidstack/react/player/layouts/default';

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
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
    title,
    mediaUrl,
    coverArtUrl,
    subtitlesUrl,
    mimeType,
    onEnd,
    onPlay,
    autoPlay = false
}) => {
    const isAudio = mimeType.startsWith('audio/');

    return (
        <VidstackPlayer
            title={title}
            src={mediaUrl}
            viewType={isAudio ? 'audio' : 'video'}
            onEnd={onEnd}
            onPlay={onPlay}
            autoPlay={autoPlay}
            crossOrigin="anonymous"
            playsInline
            className="w-full h-full bg-black overflow-hidden shadow-xl"
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
                <DefaultAudioLayout icons={defaultLayoutIcons} />
            ) : (
                <DefaultVideoLayout icons={defaultLayoutIcons} />
            )}
        </VidstackPlayer>
    );
};
