import { App, Button, Card, Space, Table, Tabs, Tag, Typography } from "antd";
import type { VocabAiTestResult } from "../../hooks/ai.hooks";

const { Text, Paragraph } = Typography;

type Props = {
    result: VocabAiTestResult;
    elapsed: string;
};

export function VocabAiResultCard({ result, elapsed }: Props) {
    const { message } = App.useApp();

    const handleCopy = () => {
        void navigator.clipboard.writeText(result.raw);
        message.success("Copied to clipboard");
    };

    const formattedItems = [
        { label: "zh_translation", value: result.result.zh_translation, strong: true },
        { label: "pinyin", value: result.result.pinyin },
        {
            label: "needs_language_review",
            value: (
                <Tag color={result.result.needs_language_review ? "orange" : "green"}>
                    {String(result.result.needs_language_review)}
                </Tag>
            ),
        },
    ];

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
                        key: "raw",
                        label: "Raw JSON",
                        children: (
                            <pre
                                style={{
                                    background: "#f5f5f5",
                                    padding: 12,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    maxHeight: 300,
                                    overflow: "auto",
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
                                        style={{ fontSize: 12, background: "#f5f5f5", padding: 8 }}
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
