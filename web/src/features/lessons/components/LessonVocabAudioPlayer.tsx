import { Button, Space } from "antd";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type LessonVocabAudioPlayerProps = {
    enAudioUrl: string | null;
    zhAudioUrl: string | null;
    word: string;
};

export function LessonVocabAudioPlayer({
    enAudioUrl,
    zhAudioUrl,
    word,
}: LessonVocabAudioPlayerProps): React.ReactElement {
    const [playing, setPlaying] = useState<"en" | "zh" | null>(null);
    const activeAudio = useRef<HTMLAudioElement | null>(null);
    const playingRef = useRef<"en" | "zh" | null>(null);

    useEffect(() => {
        playingRef.current = playing;
    }, [playing]);

    useEffect(() => {
        return () => {
            activeAudio.current?.pause();
            activeAudio.current = null;
        };
    }, []);

    const play = useCallback((lang: "en" | "zh", url: string) => {
        if (activeAudio.current) {
            activeAudio.current.pause();
            activeAudio.current.currentTime = 0;
        }
        if (playingRef.current === lang) {
            activeAudio.current = null;
            setPlaying(null);
            return;
        }
        const audio = new Audio(url);
        audio.onended = () => {
            activeAudio.current = null;
            setPlaying(null);
        };
        void audio.play();
        activeAudio.current = audio;
        setPlaying(lang);
    }, []);

    return (
        <Space className="lesson-vocab-audio" wrap size="small" align="center">
            {word ? <span>{word}</span> : null}
            <Button
                type={playing === "en" ? "primary" : "default"}
                disabled={!enAudioUrl}
                size="small"
                onClick={() => enAudioUrl && play("en", enAudioUrl)}
            >
                EN
            </Button>
            <Button
                type={playing === "zh" ? "primary" : "default"}
                disabled={!zhAudioUrl}
                size="small"
                onClick={() => zhAudioUrl && play("zh", zhAudioUrl)}
            >
                ZH
            </Button>
        </Space>
    );
}
