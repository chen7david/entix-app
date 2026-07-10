import { createContext, useContext } from "react";

type VocabAudioContextValue = {
    play: (url: string) => void;
    playingUrl: string | null;
};

const VocabAudioContext = createContext<VocabAudioContextValue | null>(null);

export function VocabAudioProvider({
    value,
    children,
}: {
    value: VocabAudioContextValue;
    children: React.ReactNode;
}) {
    return <VocabAudioContext.Provider value={value}>{children}</VocabAudioContext.Provider>;
}

export function useVocabAudioContext(): VocabAudioContextValue {
    const ctx = useContext(VocabAudioContext);
    if (!ctx) {
        throw new Error("useVocabAudioContext must be used within VocabAudioProvider");
    }
    return ctx;
}
