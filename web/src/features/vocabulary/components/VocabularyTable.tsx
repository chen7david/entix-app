import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useVocabAudio } from "@web/src/features/vocabulary/hooks/useVocabAudio";
import type {
    SessionVocabularyItemDTO,
    VocabularyItemDTO,
} from "@web/src/features/vocabulary/hooks/useVocabulary";
import {
    useVocabAudioContext,
    VocabAudioProvider,
} from "@web/src/features/vocabulary/hooks/vocab-audio.context";
import { dedupeSessionVocabularyByWord } from "@web/src/features/vocabulary/utils/sessionVocabularyDisplay";
import { Button, Empty, Popconfirm, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { IpaBracketed } from "./IpaBracketed";
import { VocabAudioCell } from "./VocabAudioCell";
import { VocabularyStatusBadge } from "./VocabularyStatusBadge";

const { Text } = Typography;

type DisplayRow = SessionVocabularyItemDTO & { assignedStudentCount?: number };

function WordCell({ vocab }: { vocab: VocabularyItemDTO }) {
    const { play, playingUrl } = useVocabAudioContext();
    return (
        <Text strong>
            <VocabAudioCell
                text={vocab.text}
                url={vocab.enAudioUrl}
                isPlaying={!!vocab.enAudioUrl && playingUrl === vocab.enAudioUrl}
                onPlay={play}
            />
        </Text>
    );
}

function TranslationCell({ vocab }: { vocab: VocabularyItemDTO }) {
    const { play, playingUrl } = useVocabAudioContext();
    const text = vocab.zhTranslation || "—";
    return (
        <VocabAudioCell
            text={text}
            url={vocab.zhAudioUrl}
            isPlaying={!!vocab.zhAudioUrl && playingUrl === vocab.zhAudioUrl}
            onPlay={play}
        />
    );
}

export function VocabularyTable({
    items,
    loading,
    groupByWord = false,
    onDelete,
    onDeleteBatch,
    onEdit,
    isDeleting = false,
}: {
    items: SessionVocabularyItemDTO[] | VocabularyItemDTO[];
    loading: boolean;
    groupByWord?: boolean;
    onDelete?: (id: string) => void;
    onDeleteBatch?: (vocabId: string) => void;
    onEdit?: (item: VocabularyItemDTO) => void;
    isDeleting?: boolean;
}) {
    const { play, playingUrl } = useVocabAudio();
    const audioContextValue = useMemo(() => ({ play, playingUrl }), [play, playingUrl]);

    const dataSource = useMemo(() => {
        const baseItems = (items || []).filter(Boolean);
        if (!groupByWord) return baseItems as DisplayRow[];
        // Only dedupe if the items are SessionVocabularyItemDTO (they have a .vocabulary property)
        const firstItem = baseItems[0];
        if (firstItem && "vocabulary" in firstItem) {
            return dedupeSessionVocabularyByWord(baseItems as SessionVocabularyItemDTO[]);
        }
        return baseItems as DisplayRow[];
    }, [items, groupByWord]);

    const columns = useMemo(() => {
        const getVocab = (record: DisplayRow) =>
            record && "vocabulary" in record
                ? record.vocabulary
                : (record as unknown as VocabularyItemDTO);

        const baseColumns: ColumnsType<DisplayRow> = [
            {
                title: "Word",
                key: "text",
                width: 150,
                render: (_, record) => <WordCell vocab={getVocab(record)} />,
            },
            {
                title: "Translation",
                key: "zhTranslation",
                width: 150,
                render: (_, record) => <TranslationCell vocab={getVocab(record)} />,
            },
            {
                title: "Pinyin",
                key: "pinyin",
                width: 150,
                render: (_, record) => getVocab(record).pinyin || "—",
            },
            {
                title: "IPA",
                key: "ipaUs",
                width: 120,
                render: (_, record) => <IpaBracketed value={getVocab(record).ipaUs} />,
            },
            {
                title: "Definition",
                key: "definitionSimple",
                width: 300,
                ellipsis: true,
                render: (_, record) => getVocab(record).definitionSimple || "—",
            },
            {
                title: "Status",
                key: "status",
                width: 120,
                render: (_, record) => <VocabularyStatusBadge status={getVocab(record).status} />,
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

        if (showDelete || onEdit) {
            result = [
                ...result,
                {
                    title: "Action",
                    key: "action",
                    width: 120,
                    align: "center",
                    fixed: "right",
                    render: (_, record) => {
                        const vocab = getVocab(record);
                        return (
                            <Space size={4}>
                                {onEdit && (
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => onEdit(vocab)}
                                    />
                                )}
                                {showDelete && (
                                    <Popconfirm
                                        title="Remove from session?"
                                        description={
                                            groupByWord
                                                ? `This will remove "${vocab.text}" from the wordlist of ALL students in this session.`
                                                : `This will remove "${vocab.text}" from this student's list for this session.`
                                        }
                                        onConfirm={() => {
                                            if (groupByWord && onDeleteBatch) {
                                                onDeleteBatch(vocab.id);
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
                                )}
                            </Space>
                        );
                    },
                },
            ];
        }

        return result;
    }, [groupByWord, onDelete, onDeleteBatch, onEdit, isDeleting]);

    return (
        <VocabAudioProvider value={audioContextValue}>
            <Table
                rowKey={(row) => {
                    const vocabId =
                        "vocabulary" in row
                            ? (row as SessionVocabularyItemDTO).vocabulary.id
                            : (row as VocabularyItemDTO).id;
                    return groupByWord ? vocabId : (row as { id: string }).id;
                }}
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
        </VocabAudioProvider>
    );
}
