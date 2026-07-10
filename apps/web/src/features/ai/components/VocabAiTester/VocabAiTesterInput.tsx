import { Button, Input, Space } from "antd";
import type { KeyboardEvent } from "react";

type Props = {
    phrase: string;
    setPhrase: (v: string) => void;
    loading: boolean;
    onRun: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export function VocabAiTesterInput({ phrase, setPhrase, loading, onRun, onKeyDown }: Props) {
    return (
        <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
            <Input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="English phrase (↑↓ for history)"
                size="large"
                disabled={loading}
            />
            <Button
                type="primary"
                onClick={onRun}
                loading={loading}
                size="large"
                disabled={!phrase.trim()}
            >
                Run
            </Button>
        </Space.Compact>
    );
}
