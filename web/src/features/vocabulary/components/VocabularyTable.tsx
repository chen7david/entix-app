import { DeleteOutlined } from "@ant-design/icons";
import type { SessionVocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";
import { dedupeSessionVocabularyByWord } from "@web/src/features/vocabulary/utils/sessionVocabularyDisplay";
import { Button, Empty, Popconfirm, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { VocabularyStatusBadge } from "./VocabularyStatusBadge";

const { Text } = Typography;

type DisplayRow = SessionVocabularyItemDTO & { assignedStudentCount?: number };

export function VocabularyTable({
    items,
    loading,
    groupByWord = false,
    onDelete,
    onDeleteBatch,
    isDeleting = false,
}: {
    items: SessionVocabularyItemDTO[];
    loading: boolean;
    groupByWord?: boolean;
    onDelete?: (studentVocabId: string) => void;
    onDeleteBatch?: (vocabId: string) => void;
    isDeleting?: boolean;
}) {
    const dataSource = useMemo(() => {
        if (!groupByWord) return items as DisplayRow[];
        return dedupeSessionVocabularyByWord(items);
    }, [items, groupByWord]);

    const columns = useMemo(() => {
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

        let result = baseColumns;

        if (groupByWord) {
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
            result = [baseColumns[0], studentsColumn, ...baseColumns.slice(1)];
        }

        const showDelete = groupByWord ? !!onDeleteBatch : !!onDelete;

        if (showDelete) {
            result = [
                ...result,
                {
                    title: "Action",
                    key: "action",
                    width: 80,
                    align: "center",
                    fixed: "right",
                    render: (_, record) => (
                        <Popconfirm
                            title="Remove from session?"
                            description={
                                groupByWord
                                    ? `This will remove "${record.vocabulary.text}" from the wordlist of ALL students in this session.`
                                    : `This will remove "${record.vocabulary.text}" from this student's list for this session.`
                            }
                            onConfirm={() => {
                                if (groupByWord && onDeleteBatch) {
                                    onDeleteBatch(record.vocabulary.id);
                                } else if (!groupByWord && onDelete) {
                                    onDelete(record.id);
                                }
                            }}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true, loading: isDeleting }}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={isDeleting}
                            />
                        </Popconfirm>
                    ),
                },
            ];
        }

        return result;
    }, [groupByWord, onDelete, onDeleteBatch, isDeleting]);

    return (
        <Table
            rowKey={(row) => (groupByWord ? row.vocabulary.id : row.id)}
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            size="middle"
            scroll={{ x: 800 }}
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
