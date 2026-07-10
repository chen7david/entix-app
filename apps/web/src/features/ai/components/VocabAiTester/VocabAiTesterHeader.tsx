import { Typography } from "antd";

const { Title, Text } = Typography;

export function VocabAiTesterHeader() {
    return (
        <div style={{ marginBottom: 24 }}>
            <Title level={2}>Vocab AI Pipeline Tester</Title>
            <Text type="secondary">
                Provider: <strong>DeepSeek V4 Flash</strong> (default) — credentials loaded from
                server env. Set <code>AI_PROVIDER=gemini</code> to use Google. No DB writes.
            </Text>
        </div>
    );
}
