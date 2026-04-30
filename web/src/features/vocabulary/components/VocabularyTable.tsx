import type { SessionVocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";
import { dedupeSessionVocabularyByWord } from "@web/src/features/vocabulary/utils/sessionVocabularyDisplay";
import { Empty, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { VocabularyStatusBadge } from "./VocabularyStatusBadge";

const { Text } = Typography;

type DisplayRow = SessionVocabularyItemDTO & { assignedStudentCount?: number };

const baseColumns: ColumnsType<DisplayRow> = [
    {
        title: "Word",
        key: "text",
        render: (_, record) => <Text strong>{record.vocabulary.text}</Text>,
    },
    {
        title: "Translation",
        key: "zhTranslation",
        render: (_, record) => record.vocabulary.zhTranslation || "—",
    },
    {
        title: "Pinyin",
        key: "pinyin",
        render: (_, record) => record.vocabulary.pinyin || "—",
    },
    {
        title: "Status",
        key: "status",
        render: (_, record) => <VocabularyStatusBadge status={record.vocabulary.status} />,
    },
];

export function VocabularyTable({
    items,
    loading,
    /** One row per vocabulary word; shows how many students have it on their list for this session. */
    groupByWord = false,
}: {
    items: SessionVocabularyItemDTO[];
    loading: boolean;
    groupByWord?: boolean;
}) {
    const dataSource = useMemo(() => {
        if (!groupByWord) return items as DisplayRow[];
        return dedupeSessionVocabularyByWord(items);
    }, [items, groupByWord]);

    const columns = useMemo(() => {
        if (!groupByWord) return baseColumns;
        const studentsColumn: ColumnsType<DisplayRow>[number] = {
            title: "Students",
            key: "students",
            width: 110,
            render: (_, record) => (
                <Tag title="Students with this word on their list for this session">
                    {record.assignedStudentCount ?? 0}
                </Tag>
            ),
        };
        return [baseColumns[0], studentsColumn, ...baseColumns.slice(1)];
    }, [groupByWord]);

    return (
        <Table
            rowKey={(row) => (groupByWord ? row.vocabulary.id : row.id)}
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            size="middle"
            locale={{
                emptyText: (
                    <Empty
                        description="No vocabulary yet. Add a word above to get started."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ),
            }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
        />
    );
}
