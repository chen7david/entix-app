import { IpaBracketed } from "@web/src/features/vocabulary/components/IpaBracketed";
import { App, Badge, Button, Card, List, Space, Table, Tabs, Tag, Typography, theme } from "antd";
import type { VocabAiTestResult } from "../../hooks/ai.hooks";

const { Text, Paragraph } = Typography;

type Props = {
    result: VocabAiTestResult;
    elapsed: string;
};

export function VocabAiResultCard({ result, elapsed }: Props) {
    const { message } = App.useApp();
    const { token } = theme.useToken();

    const handleCopy = () => {
        void navigator.clipboard.writeText(result.raw);
        message.success("Copied to clipboard");
    };

    const formattedItems = [
        { label: "zh_translation", value: result.result.zh_translation, strong: true },
        { label: "pinyin", value: result.result.pinyin },
        { label: "ipa_us", value: <IpaBracketed value={result.result.ipa_us} /> },
        { label: "syllables_en", value: result.result.syllables_en },
        {
            label: "syllables_ipa",
            value: <IpaBracketed value={result.result.syllables_ipa} />,
        },
        { label: "definition_simple", value: result.result.definition_simple },
        {
            label: "needs_language_review",
            value: (
                <Tag color={result.result.needs_language_review ? "orange" : "green"}>
                    {String(result.result.needs_language_review)}
                </Tag>
            ),
        },
    ];

    const p = result.result;
    const validationChecks = [
        { label: "zh_translation is string", ok: typeof p.zh_translation === "string" },
        { label: "zh_translation is non-empty", ok: p.zh_translation?.length > 0 },
        { label: "pinyin is string", ok: typeof p.pinyin === "string" },
        { label: "pinyin is non-empty", ok: p.pinyin?.length > 0 },
        { label: "ipa_us is string", ok: typeof p.ipa_us === "string" },
        { label: "ipa_us is non-empty", ok: p.ipa_us?.length > 0 },
        { label: "syllables_en is string", ok: typeof p.syllables_en === "string" },
        { label: "syllables_en is non-empty", ok: p.syllables_en?.length > 0 },
        { label: "syllables_ipa is string", ok: typeof p.syllables_ipa === "string" },
        { label: "syllables_ipa is non-empty", ok: p.syllables_ipa?.length > 0 },
        { label: "definition_simple is string", ok: typeof p.definition_simple === "string" },
        { label: "definition_simple is non-empty", ok: p.definition_simple?.length > 0 },
        {
            label: "needs_language_review is boolean",
            ok: typeof p.needs_language_review === "boolean",
        },
    ];

    const allValid = validationChecks.every((c) => c.ok);

    return (
        <Card
            title={
                <Space>
                    Results{" "}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {elapsed} · {result.generatedAt}
                    </Text>
                </Space>
            }
            extra={
                <Button size="small" onClick={handleCopy}>
                    Copy JSON
                </Button>
            }
            style={{ marginBottom: 24 }}
        >
            <Tabs
                defaultActiveKey="formatted"
                items={[
                    {
                        key: "formatted",
                        label: "Formatted",
                        children: (
                            <Table
                                dataSource={formattedItems}
                                columns={[
                                    {
                                        title: "Field",
                                        dataIndex: "label",
                                        key: "label",
                                        width: 150,
                                    },
                                    {
                                        title: "Value",
                                        dataIndex: "value",
                                        key: "value",
                                        render: (val, record) =>
                                            record.strong ? <strong>{val}</strong> : val,
                                    },
                                ]}
                                pagination={false}
                                size="small"
                                bordered
                            />
                        ),
                    },
                    {
                        key: "validation",
                        label: (
                            <Space>
                                Validation
                                <Badge status={allValid ? "success" : "error"} />
                            </Space>
                        ),
                        children: (
                            <List
                                size="small"
                                bordered
                                dataSource={validationChecks}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Space>
                                            {item.ok ? (
                                                <span style={{ color: "#52c41a" }}>✓</span>
                                            ) : (
                                                <span style={{ color: "#ff4d4f" }}>✗</span>
                                            )}
                                            <Text delete={!item.ok}>{item.label}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        ),
                    },
                    {
                        key: "raw",
                        label: "Raw JSON",
                        children: (
                            <pre
                                style={{
                                    background: token.colorFillAlter,
                                    padding: 12,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    maxHeight: 300,
                                    overflow: "auto",
                                    color: token.colorText,
                                }}
                            >
                                {JSON.stringify(JSON.parse(result.raw), null, 2)}
                            </pre>
                        ),
                    },
                    {
                        key: "metadata",
                        label: "Metadata",
                        children: (
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Paragraph>
                                    <Text strong>Model:</Text> <Tag>{result.model}</Tag>
                                </Paragraph>
                                <Paragraph>
                                    <Text strong>Prompt:</Text>
                                    <pre
                                        style={{
                                            fontSize: 12,
                                            background: token.colorFillAlter,
                                            padding: 8,
                                            color: token.colorText,
                                        }}
                                    >
                                        {result.prompt}
                                    </pre>
                                </Paragraph>
                                {result.repair?.applied && (
                                    <Paragraph>
                                        <Tag color="blue">Repair Applied</Tag>
                                        <Text type="secondary">
                                            {" "}
                                            Reason: {result.repair.reason}
                                        </Text>
                                    </Paragraph>
                                )}
                            </Space>
                        ),
                    },
                ]}
            />
        </Card>
    );
}
