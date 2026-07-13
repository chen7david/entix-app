import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { CursorPaginationConfig } from "@web/src/components/data/DataTable.types";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useOrganization } from "@web/src/features/organization";
import { IpaBracketed } from "@web/src/features/vocabulary/components/IpaBracketed";
import { VocabularyEditDrawer } from "@web/src/features/vocabulary/components/VocabularyEditDrawer";
import { VocabularyStatusBadge } from "@web/src/features/vocabulary/components/VocabularyStatusBadge";
import {
    useVocabulary,
    useVocabularyBank,
    useVocabularyBankLibrary,
    type VocabularyItemDTO,
} from "@web/src/features/vocabulary/hooks/useVocabulary";
import { Button, Popconfirm, Space, Tooltip, Typography } from "antd";
import { useState } from "react";

const { Text } = Typography;

export default function GlobalVocabularyPage() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    const [filters, setFilters] = useState<{ search?: string }>({});
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [pageSize, setPageSize] = useState(10);
    const [direction, setDirection] = useState<"next" | "prev">("next");

    const [editingItem, setEditingItem] = useState<VocabularyItemDTO | null>(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);

    const { items, nextCursor, isLoading } = useVocabularyBankLibrary({
        organizationId,
        search: filters.search,
        cursor,
        limit: pageSize,
        direction,
    });

    const { updateVocabularyBankMutation, deleteVocabularyBankMutation } =
        useVocabularyBank(organizationId);
    const { createVocabularyMutation } = useVocabulary(organizationId);

    const handleEdit = (item: VocabularyItemDTO) => {
        setEditingItem(item);
        setIsDrawerVisible(true);
    };

    const handleSave = async (values: Partial<VocabularyItemDTO>) => {
        if (editingItem) {
            await updateVocabularyBankMutation.mutateAsync({
                vocabId: editingItem.id,
                data: values,
            });
        } else if (values.text) {
            await createVocabularyMutation.mutateAsync({
                text: values.text,
            });
        }
        setIsDrawerVisible(false);
        setEditingItem(null);
    };

    const tablePagination: CursorPaginationConfig = {
        hasNextPage: !!nextCursor,
        hasPrevPage: cursorStack.length > 0,
        pageSize,
        onNext: () => {
            if (nextCursor) {
                setCursorStack((prev) => [...prev, cursor || ""]);
                setCursor(nextCursor);
                setDirection("next");
            }
        },
        onPrev: () => {
            if (cursorStack.length > 0) {
                const previousStack = [...cursorStack];
                const prevCursor = previousStack.pop();
                setCursorStack(previousStack);
                setCursor(prevCursor || undefined);
                setDirection("prev");
            }
        },
        onPageSizeChange: (size) => {
            setPageSize(size);
            setCursor(undefined);
            setCursorStack([]);
            setDirection("next");
        },
    };

    const columns = [
        {
            title: "Word",
            dataIndex: "text",
            key: "text",
            width: 180,
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: "Translation",
            dataIndex: "zhTranslation",
            key: "zhTranslation",
            width: 180,
            render: (text: string) => text || "—",
        },
        {
            title: "Pinyin",
            dataIndex: "pinyin",
            key: "pinyin",
            width: 150,
            render: (text: string) => text || "—",
        },
        {
            title: "IPA",
            dataIndex: "ipaUs",
            key: "ipaUs",
            width: 120,
            render: (text: string | null | undefined) => <IpaBracketed value={text} />,
        },
        {
            title: "Definition",
            dataIndex: "definitionSimple",
            key: "definitionSimple",
            ellipsis: true,
            render: (text: string) => text || "—",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status: any) => <VocabularyStatusBadge status={status} />,
        },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <PageHeader
                title="Vocabulary Bank"
                subtitle="Manage the global list of vocabulary words and phrases."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingItem(null);
                            setIsDrawerVisible(true);
                        }}
                        size="large"
                        className="h-11 font-semibold"
                    >
                        Add Vocabulary
                    </Button>
                }
            />

            <div className="flex-1 min-h-0">
                <DataTableWithFilters
                    config={{
                        columns,
                        data: items,
                        loading: isLoading,
                        rowKey: "id",
                        filters: [
                            {
                                type: "search",
                                key: "q",
                                placeholder: "Search vocabulary...",
                            },
                        ],
                        actions: (record: VocabularyItemDTO) => (
                            <Space>
                                <Tooltip title="Edit">
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(record)}
                                    />
                                </Tooltip>
                                <Popconfirm
                                    title="Delete from bank?"
                                    onConfirm={() => deleteVocabularyBankMutation.mutate(record.id)}
                                >
                                    <Button
                                        danger
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        loading={deleteVocabularyBankMutation.isPending}
                                    />
                                </Popconfirm>
                            </Space>
                        ),
                        onFiltersChange: (newFilters) => {
                            setFilters({ search: newFilters.q || undefined });
                            setCursor(undefined);
                            setCursorStack([]);
                            setDirection("next");
                        },
                        pagination: tablePagination,
                    }}
                />
            </div>

            <VocabularyEditDrawer
                visible={isDrawerVisible}
                item={editingItem}
                onCancel={() => {
                    setIsDrawerVisible(false);
                    setEditingItem(null);
                }}
                onSave={handleSave}
                loading={
                    updateVocabularyBankMutation.isPending || createVocabularyMutation.isPending
                }
            />
        </div>
    );
}
