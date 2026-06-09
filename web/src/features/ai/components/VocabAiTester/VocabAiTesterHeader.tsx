import { Typography } from "antd";

const { Title, Text } = Typography;

export function VocabAiTesterHeader() {
    return (
        <div style={{ marginBottom: 24 }}>
            <Title level={2}>Vocab AI Pipeline Tester</Title>
            <Text type="secondary">
                Provider: <strong>Open WebUI</strong> — credentials loaded from server env vars. No
                DB writes. Local AI pipeline tester only.
            </Text>
        </div>
    );
}
