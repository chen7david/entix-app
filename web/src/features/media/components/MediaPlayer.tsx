import {
    MediaProvider,
    Poster,
    Track,
    useMediaRemote,
    useMediaState,
    MediaPlayer as VidstackPlayer,
} from "@vidstack/react";
import type React from "react";
import { useEffect, useRef } from "react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
    AudioOutlined,
    RetweetOutlined,
    StepBackwardOutlined,
    StepForwardOutlined,
} from "@ant-design/icons";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import { Tooltip } from "antd";

interface MediaPlayerProps {
    title: string;
    description?: string;
    mediaUrl: string;
    coverArtUrl?: string;
    subtitlesUrl?: string;
    mimeType: string;
    /** Fires when playback stops at the end **without** repeating (not fired when `loop` is on). */
    onEnded?: () => void;
    onPlay?: () => void;
    autoPlay?: boolean;
    onNext?: () => void;
    onPrevious?: () => void;
    /**
     * When true, repeat-at-end is enabled by default (user can still toggle). When false (e.g.
     * playlists), repeat is forced off so `onEnded` can advance the queue.
     * @default true
     */
    loop?: boolean;
}

/** Syncs Vidstack `userPrefersLoop` from prop. Do not set `loop` on the player element — that locks repeat on and breaks the toggle. */
function SyncLoopPreference({ repeatByDefault }: { repeatByDefault: boolean }) {
    const remote = useMediaRemote();
    const previousPolicy = useRef<boolean | undefined>(undefined);
    useEffect(() => {
        if (previousPolicy.current === repeatByDefault) return;
        previousPolicy.current = repeatByDefault;
        remote.userPrefersLoopChange(repeatByDefault);
    }, [repeatByDefault, remote]);
    return null;
}

type TransportLoopVariant = "overlay" | "settings";

/**
 * Overlay: icon control in the top chrome (placement via `largeLayout` / `smallLayout` slots).
 * Settings: compact row for the settings panel (paired with `settingsMenuStartItems`).
 * Active “on” mirrors common players (YouTube-style): no outline border — icon + soft circular wash only.
 */
function TransportLoopControl({ variant = "overlay" }: { variant?: TransportLoopVariant }) {
    const remote = useMediaRemote();
    const userPrefersLoop = useMediaState("userPrefersLoop");
    /** Effective repeat (mirrors Vidstack `loop` state: `providedLoop || userPrefersLoop`). */
    const loopOn = useMediaState("loop");

    const isSettings = variant === "settings";

    const tooltip = loopOn ? "Loop on — repeats this clip when it ends" : "Loop off";

    /** Retweet’s paths read lighter than StepForward/Back; multi drop-shadow reads heavier without resizing. */
    const loopIconWeight =
        "[&_.anticon]:[filter:drop-shadow(0.55px_0_0_currentColor)_drop-shadow(-0.55px_0_0_currentColor)_drop-shadow(0_0.55px_0_currentColor)_drop-shadow(0_-0.55px_0_currentColor)]";

    const button = (
        <button
            type="button"
            className={
                isSettings
                    ? `entix-transport-loop entix-transport-loop--settings inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-transparent px-2 transition-[background,color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 ${
                          loopOn
                              ? "bg-white/[0.14] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                              : "bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
                      }`
                    : `entix-transport-loop entix-transport-loop--overlay inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-transparent transition-[background,color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 ${
                          loopOn
                              ? "bg-white/[0.14] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                              : "bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
                      }`
            }
            aria-label={loopOn ? "Turn off loop" : "Turn on loop"}
            aria-pressed={loopOn}
            data-state={loopOn ? "on" : "off"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                // Omit trigger so the request targets the player; passing `nativeEvent.target` can
                // point at an SVG child and break dispatch in some cases.
                remote.userPrefersLoopChange(!userPrefersLoop);
            }}
        >
            <span className={isSettings ? `text-lg ${loopIconWeight}` : `text-xl ${loopIconWeight}`}>
                <RetweetOutlined />
            </span>
        </button>
    );

    return (
        <Tooltip
            title={tooltip}
            placement="top"
            mouseEnterDelay={0.4}
            getPopupContainer={() => document.body}
        >
            {button}
        </Tooltip>
    );
}

/** Decorative bars only — not a real waveform (that needs Web Audio analysis or precomputed peaks). */
function AudioPlaceholderWave() {
    return (
        <div
            className="entix-audio-placeholder-wave flex h-10 items-end justify-center gap-1.5 opacity-90"
            aria-hidden
        >
            {[0.35, 0.65, 1, 0.55, 0.8, 0.45, 0.9].map((h, i) => (
                <span
                    key={i}
                    className="entix-audio-placeholder-wave__bar w-1.5 rounded-sm bg-white/40"
                    style={{ height: `${Math.round(h * 100)}%` }}
                />
            ))}
        </div>
    );
}

function SettingsLoopSection() {
    return (
        <div className="entix-settings-loop border-b border-white/10 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-white">Loop</span>
                <TransportLoopControl variant="settings" />
            </div>
            <p className="mt-1 text-xs text-white/45">Repeat this clip when it ends</p>
        </div>
    );
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
    title,
    description,
    mediaUrl,
    coverArtUrl,
    subtitlesUrl,
    mimeType,
    onEnded,
    onPlay,
    autoPlay = false,
    onNext,
    onPrevious,
    loop: repeatByDefault = true,
}) => {
    const isAudio = mimeType.startsWith("audio/");

    /**
     * Spacers must not use `aria-hidden` on `.vds-button` — Vidstack theme hides
     * `.vds-button[aria-hidden='true']` with `display: none`, which collapsed layout and shifted play.
     */
    const prevButton = onPrevious ? (
        <button
            type="button"
            className="vds-button entix-transport-skip entix-transport-skip--prev"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                onPrevious();
            }}
            aria-label="Previous Track"
        >
            <StepBackwardOutlined className="text-xl" />
        </button>
    ) : (
        <span aria-hidden="true">
            <button
                type="button"
                disabled
                tabIndex={-1}
                className="vds-button entix-transport-skip entix-transport-skip--prev entix-transport-skip--placeholder"
            >
                <StepBackwardOutlined className="text-xl" />
            </button>
        </span>
    );

    const nextButton = onNext ? (
        <button
            type="button"
            className="vds-button entix-transport-skip entix-transport-skip--next"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                onNext();
            }}
            aria-label="Next Track"
        >
            <StepForwardOutlined className="text-xl" />
        </button>
    ) : (
        <span aria-hidden="true">
            <button
                type="button"
                disabled
                tabIndex={-1}
                className="vds-button entix-transport-skip entix-transport-skip--next entix-transport-skip--placeholder"
            >
                <StepForwardOutlined className="text-xl" />
            </button>
        </span>
    );

    const layoutSlots = {
        beforePlayButton: prevButton,
        afterPlayButton: nextButton,
        /** Desktop: directly before the settings (gear) button in the top bar (`menuGroup="top"`). */
        largeLayout: {
            topControlsGroupEnd: <TransportLoopControl variant="overlay" key="entix-loop-lg" />,
        },
        /** Mobile: top bar only — left side so it stays in the header row (not near center transport). */
        smallLayout: {
            topControlsGroupStart: <TransportLoopControl variant="overlay" key="entix-loop-sm" />,
        },
        /** Surface loop at the top of the settings panel (still available under Playback too). */
        settingsMenuStartItems: <SettingsLoopSection key="entix-loop-settings" />,
    };

    return (
        <VidstackPlayer
            title={title}
            src={mediaUrl}
            viewType="video" /* Force video view so audio tracks can use the cinematic layout */
            onEnded={onEnded}
            onPlay={onPlay}
            autoPlay={autoPlay}
            loop={false}
            playsInline
            className="w-full h-full overflow-hidden relative"
        >
            <SyncLoopPreference repeatByDefault={repeatByDefault} />

            <MediaProvider>
                {coverArtUrl && (
                    <Poster className="vds-poster" src={coverArtUrl} alt={`${title} Cover Art`} />
                )}
                {subtitlesUrl && (
                    <Track src={subtitlesUrl} kind="subtitles" label="English" lang="en" default />
                )}
            </MediaProvider>

            {/*
              Audio without art: paint above the black media surface (was -z-10 before MediaProvider, so it disappeared).
              Vidstack still provides the full control chrome via DefaultVideoLayout — this is visual filler only.
            */}
            {isAudio && !coverArtUrl && (
                <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center bg-gradient-to-b from-zinc-800 via-zinc-900 to-black px-6 text-center">
                    <AudioOutlined className="mb-3 text-5xl text-blue-400/80" />
                    <AudioPlaceholderWave />
                    <h3 className="mt-6 w-full truncate text-2xl font-semibold text-white/95">{title}</h3>
                    {description ? (
                        <p className="mt-2 line-clamp-2 max-w-lg text-sm text-white/50">{description}</p>
                    ) : (
                        <p className="mt-2 text-sm text-white/40">Audio</p>
                    )}
                </div>
            )}

            <DefaultVideoLayout icons={defaultLayoutIcons} menuGroup="top" slots={layoutSlots} />
        </VidstackPlayer>
    );
};
