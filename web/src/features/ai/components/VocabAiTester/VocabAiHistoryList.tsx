import { List, Space, Tag, Typography, theme } from "antd";
import type { VocabAiTestResult } from "../../hooks/ai.hooks";

const { Text } = Typography;

type HistoryItem = {
    phrase: string;
    result: VocabAiTestResult;
    elapsed: string;
};

type Props = {
    items: HistoryItem[];
    selectedItem: HistoryItem | null;
    onSelect: (item: HistoryItem) => void;
    onClear: () => void;
};

export function VocabAiHistoryList({ items, selectedItem, onSelect, onClear }: Props) {
    const { token } = theme.useToken();

    if (items.length === 0) return null;

    return (
        <div style={{ marginTop: 24 }}>
            <Space style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }}>
                <Text strong>Session History</Text>
                <Typography.Link onClick={onClear}>Clear</Typography.Link>
            </Space>
            <List
                size="small"
                bordered
                dataSource={items}
                renderItem={(item) => (
                    <List.Item
                        onClick={() => onSelect(item)}
                        style={{
                            cursor: "pointer",
                            background:
                                selectedItem === item ? token.colorPrimaryBg : "transparent",
                            transition: "background 0.2s",
                        }}
                    >
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                            <Space>
                                <span
                                    style={{
                                        color: item.result ? token.colorSuccess : token.colorError,
                                    }}
                                >
                                    ●
                                </span>
                                <Text>{item.phrase}</Text>
                            </Space>
                            <Space>
                                <Tag color="default">{item.elapsed}</Tag>
                            </Space>
                        </Space>
                    </List.Item>
                )}
            />
        </div>
    );
}
