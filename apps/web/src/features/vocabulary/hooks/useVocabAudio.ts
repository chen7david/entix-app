import { useCallback, useEffect, useRef, useState } from "react";

export function useVocabAudio() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playingUrlRef = useRef<string | null>(null);
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);

    const play = useCallback((url: string) => {
        if (!url) return;

        if (playingUrlRef.current === url) {
            audioRef.current?.pause();
            playingUrlRef.current = null;
            setPlayingUrl(null);
            return;
        }

        if (audioRef.current) {
            // Detach handlers so the previous audio can't clear state after we switch.
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current.pause();
            audioRef.current.src = "";
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        playingUrlRef.current = url;
        setPlayingUrl(url);

        const clearIfCurrent = () => {
            if (audioRef.current !== audio) return;
            playingUrlRef.current = null;
            setPlayingUrl(null);
        };

        audio.onended = clearIfCurrent;
        audio.onerror = clearIfCurrent;

        audio.play().catch(clearIfCurrent);
    }, []);

    useEffect(() => {
        return () => {
            audioRef.current?.pause();
        };
    }, []);

    return { play, playingUrl };
}
