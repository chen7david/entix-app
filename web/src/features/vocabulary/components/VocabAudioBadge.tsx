import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

type Props = {
    label: "EN" | "ZH";
    url: string | null | undefined;
    isPlaying: boolean;
    onPlay: (url: string) => void;
};

export function VocabAudioBadge({ label, url, isPlaying, onPlay }: Props) {
    if (!url) return null;

    const icon = isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />;

    return (
        <Tooltip title={isPlaying ? "Pause" : `Play ${label}`}>
            <button
                type="button"
                onClick={() => onPlay(url)}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    userSelect: "none",
                    background: isPlaying ? "#1677ff" : "#f0f0f0",
                    color: isPlaying ? "#fff" : "#595959",
                    transition: "all 0.15s",
                    border: "none",
                }}
                aria-pressed={isPlaying}
                aria-label={`${isPlaying ? "Pause" : "Play"} ${label} audio`}
            >
                {icon} {label}
            </button>
        </Tooltip>
    );
}
