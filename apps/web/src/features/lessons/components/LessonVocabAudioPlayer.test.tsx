import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonVocabAudioPlayer } from "./LessonVocabAudioPlayer";

type FakeInstance = {
    pause: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    currentTime: number;
    onended: (() => void) | null;
};

describe("LessonVocabAudioPlayer", () => {
    const fakeInstances: FakeInstance[] = [];

    beforeEach(() => {
        fakeInstances.length = 0;
        vi.stubGlobal(
            "Audio",
            vi.fn(function AudioMock(this: FakeInstance) {
                this.pause = vi.fn();
                this.play = vi.fn(() => Promise.resolve());
                this.currentTime = 0;
                this.onended = null;
                fakeInstances.push(this);
            }) as unknown as typeof Audio
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("renders EN and ZH buttons", () => {
        render(<LessonVocabAudioPlayer word="apple" enAudioUrl="/en.mp3" zhAudioUrl="/zh.mp3" />);
        expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ZH" })).toBeInTheDocument();
        expect(screen.getByText("apple")).toBeInTheDocument();
    });

    it("disables EN when enAudioUrl is null", () => {
        render(<LessonVocabAudioPlayer word="x" enAudioUrl={null} zhAudioUrl="/zh.mp3" />);
        expect(screen.getByRole("button", { name: "EN" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "ZH" })).not.toBeDisabled();
    });

    it("toggles off when clicking EN while EN is playing", async () => {
        render(<LessonVocabAudioPlayer word="w" enAudioUrl="/e.mp3" zhAudioUrl={null} />);

        fireEvent.click(screen.getByRole("button", { name: "EN" }));
        await waitFor(() => expect(fakeInstances[0]).toBeTruthy());
        const firstEn = fakeInstances[0];

        fireEvent.click(screen.getByRole("button", { name: "EN" }));
        expect(firstEn.pause).toHaveBeenCalled();
    });

    it("starting ZH pauses EN when EN was playing", async () => {
        render(<LessonVocabAudioPlayer word="w" enAudioUrl="/e.mp3" zhAudioUrl="/z.mp3" />);

        fireEvent.click(screen.getByRole("button", { name: "EN" }));
        await waitFor(() => expect(fakeInstances[0]).toBeTruthy());
        const first = fakeInstances[0];

        fireEvent.click(screen.getByRole("button", { name: "ZH" }));
        await waitFor(() => expect(fakeInstances.length).toBeGreaterThanOrEqual(2));
        expect(first.pause).toHaveBeenCalled();
    });

    it("after audio ends naturally, another EN click starts playback again", async () => {
        render(<LessonVocabAudioPlayer word="w" enAudioUrl="/e.mp3" zhAudioUrl="/z.mp3" />);

        fireEvent.click(screen.getByRole("button", { name: "EN" }));
        await waitFor(() => expect(fakeInstances[0]).toBeTruthy());
        const audioA = fakeInstances[0];

        await act(async () => {
            audioA.onended?.();
        });

        fireEvent.click(screen.getByRole("button", { name: "EN" }));
        await waitFor(() => expect(fakeInstances.length).toBeGreaterThanOrEqual(2));
        const audioB = fakeInstances.at(-1);
        expect(audioB?.play).toHaveBeenCalled();
    });
});
