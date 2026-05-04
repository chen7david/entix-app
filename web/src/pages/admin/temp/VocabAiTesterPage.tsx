import { VocabAiHistoryList } from "@web/src/features/ai/components/VocabAiTester/VocabAiHistoryList";
import { VocabAiResultCard } from "@web/src/features/ai/components/VocabAiTester/VocabAiResultCard";
import { VocabAiTesterHeader } from "@web/src/features/ai/components/VocabAiTester/VocabAiTesterHeader";
import { VocabAiTesterInput } from "@web/src/features/ai/components/VocabAiTester/VocabAiTesterInput";
import { useVocabAiTest, type VocabAiTestResult } from "@web/src/features/ai/hooks/ai.hooks";
import { App as AntdApp, Card, Layout } from "antd";
import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";

const { Content } = Layout;

type HistoryItem = {
    phrase: string;
    result: VocabAiTestResult;
    elapsed: string;
};

export function VocabAiTesterPage() {
    const { message } = AntdApp.useApp();
    const [phrase, setPhrase] = useState("");
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selected, setSelected] = useState<HistoryItem | null>(null);

    const historyRef = useRef<string[]>([]);
    const historyIdxRef = useRef(-1);

    const { mutateAsync: runTest, isPending } = useVocabAiTest();

    const handleRun = useCallback(async () => {
        const text = phrase.trim();
        if (!text || isPending) return;

        const start = Date.now();
        try {
            const result = await runTest({ phrase: text });
            const elapsed = `${Date.now() - start}ms`;

            const item: HistoryItem = {
                phrase: text,
                result,
                elapsed,
            };

            setHistory((prev) => [item, ...prev.slice(0, 49)]);
            setSelected(item);
            setPhrase("");

            historyRef.current = [text, ...historyRef.current.slice(0, 49)];
            historyIdxRef.current = -1;

            message.success("AI run complete");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "AI pipeline failed";
            message.error(msg);
        }
    }, [phrase, isPending, runTest, message]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            void handleRun();
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = Math.min(historyIdxRef.current + 1, historyRef.current.length - 1);
            historyIdxRef.current = next;
            setPhrase(historyRef.current[next] ?? "");
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = Math.max(historyIdxRef.current - 1, -1);
            historyIdxRef.current = next;
            setPhrase(next === -1 ? "" : (historyRef.current[next] ?? ""));
        }
    };

    return (
        <Layout style={{ background: "transparent", minHeight: "100%" }}>
            <Content style={{ padding: "24px", maxWidth: 1000, margin: "0 auto", width: "100%" }}>
                <VocabAiTesterHeader />

                <Card>
                    <VocabAiTesterInput
                        phrase={phrase}
                        setPhrase={setPhrase}
                        loading={isPending}
                        onRun={() => void handleRun()}
                        onKeyDown={handleKeyDown}
                    />

                    {selected && (
                        <VocabAiResultCard result={selected.result} elapsed={selected.elapsed} />
                    )}

                    <VocabAiHistoryList
                        items={history}
                        selectedItem={selected}
                        onSelect={setSelected}
                        onClear={() => {
                            setHistory([]);
                            setSelected(null);
                        }}
                    />
                </Card>
            </Content>
        </Layout>
    );
}
