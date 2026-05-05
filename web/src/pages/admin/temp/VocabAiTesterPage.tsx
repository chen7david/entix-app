import { VocabAiHistoryList } from "@web/src/features/ai/components/VocabAiTester/VocabAiHistoryList";
import { VocabAiResultCard } from "@web/src/features/ai/components/VocabAiTester/VocabAiResultCard";
import { VocabAiTesterHeader } from "@web/src/features/ai/components/VocabAiTester/VocabAiTesterHeader";
import { VocabAiTesterInput } from "@web/src/features/ai/components/VocabAiTester/VocabAiTesterInput";
import {
    useVocabAiAudioTest,
    useVocabAiTest,
    type VocabAiAudioTestResult,
    type VocabAiTestResult,
} from "@web/src/features/ai/hooks/ai.hooks";
import { App as AntdApp, Button, Card, Input, Layout, Space, Typography } from "antd";
import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";

const { Content } = Layout;
const { Text } = Typography;

type HistoryItem = {
    phrase: string;
    result: VocabAiTestResult;
    elapsed: string;
};

export function VocabAiTesterPage() {
    const { message } = AntdApp.useApp();
    const [phrase, setPhrase] = useState("");
    const [audioEnText, setAudioEnText] = useState("");
    const [audioZhText, setAudioZhText] = useState("");
    const [audioResult, setAudioResult] = useState<VocabAiAudioTestResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selected, setSelected] = useState<HistoryItem | null>(null);

    const historyRef = useRef<string[]>([]);
    const historyIdxRef = useRef(-1);

    const { mutateAsync: runTest, isPending } = useVocabAiTest();
    const { mutateAsync: generateAudio, isPending: isGeneratingAudio } = useVocabAiAudioTest();

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
            setAudioEnText(result.result.normalized_text);
            setAudioZhText(result.result.zh_translation);
            setAudioResult(null);

            historyRef.current = [text, ...historyRef.current.slice(0, 49)];
            historyIdxRef.current = -1;

            message.success("AI run complete");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "AI pipeline failed";
            message.error(msg);
        }
    }, [phrase, isPending, runTest, message]);

    const handleGenerateAudio = useCallback(async () => {
        const enText = audioEnText.trim();
        const zhText = audioZhText.trim();
        if (!enText || !zhText || isGeneratingAudio) return;

        try {
            const result = await generateAudio({ enText, zhText });
            setAudioResult(result);
            message.success("Audio generated");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Audio generation failed";
            message.error(msg);
        }
    }, [audioEnText, audioZhText, isGeneratingAudio, generateAudio, message]);

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

                <Card title="Audio Test" style={{ marginTop: 16 }}>
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                        <Input
                            value={audioEnText}
                            onChange={(e) => setAudioEnText(e.target.value)}
                            placeholder="EN Text"
                            disabled={isGeneratingAudio}
                        />
                        <Input
                            value={audioZhText}
                            onChange={(e) => setAudioZhText(e.target.value)}
                            placeholder="ZH Text"
                            disabled={isGeneratingAudio}
                        />
                        <Button
                            type="primary"
                            onClick={() => void handleGenerateAudio()}
                            loading={isGeneratingAudio}
                            disabled={!audioEnText.trim() || !audioZhText.trim()}
                        >
                            Generate Audio
                        </Button>

                        {audioResult && (
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <Text type="secondary">testId: {audioResult.testId}</Text>
                                <div>
                                    <Text strong>English</Text>
                                    <div>
                                        <a
                                            href={audioResult.enAudioUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            ▶ Play English
                                        </a>
                                    </div>
                                    <a
                                        href={audioResult.enAudioUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {audioResult.enAudioUrl}
                                    </a>
                                </div>
                                <div>
                                    <Text strong>Chinese</Text>
                                    <div>
                                        <a
                                            href={audioResult.zhAudioUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            ▶ Play Chinese
                                        </a>
                                    </div>
                                    <a
                                        href={audioResult.zhAudioUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {audioResult.zhAudioUrl}
                                    </a>
                                </div>
                            </Space>
                        )}
                    </Space>
                </Card>
            </Content>
        </Layout>
    );
}
