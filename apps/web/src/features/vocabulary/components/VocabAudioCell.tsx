import { theme } from "antd";

type Props = {
    text: string;
    url: string | null | undefined;
    isPlaying: boolean;
    onPlay: (url: string) => void;
};

export function VocabAudioCell({ text, url, isPlaying, onPlay }: Props) {
    const { token } = theme.useToken();

    if (!url) {
        return <span>{text}</span>;
    }

    return (
        <button
            type="button"
            onClick={() => onPlay(url)}
            style={{
                cursor: "pointer",
                borderRadius: 4,
                padding: "1px 4px",
                margin: "-1px -4px",
                fontWeight: isPlaying ? 600 : undefined,
                color: isPlaying ? token.colorSuccess : token.colorText,
                background: isPlaying ? token.colorSuccessBg : "transparent",
                transition: "all 0.15s",
                border: "none",
                textAlign: "left",
                display: "inline",
            }}
            aria-pressed={isPlaying}
        >
            {text}
        </button>
    );
}
