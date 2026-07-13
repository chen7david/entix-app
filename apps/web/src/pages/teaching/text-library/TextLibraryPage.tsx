import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { CEFR_LEVELS } from "@shared/constants/cefr";
import { PASSAGE_TYPES, TEXT_COLLECTION_TYPES } from "@shared/constants/passage";
import { defaultPassageDocJson, plainTextFromPassageContent } from "@shared/utils/passage-content";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { useOrgNavigate } from "@web/src/features/organization";
import {
    PassageContentEditor,
    type PassageDto,
    type TextCollectionDto,
    useCreatePassage,
    useCreateTextCollection,
    useDeletePassage,
    useDeleteTextCollection,
    usePassageById,
    usePassageLibrary,
    useTextCollectionById,
    useTextCollectionLibrary,
    useUpdatePassage,
    useUpdateTextCollection,
} from "@web/src/features/passages";
import { Button, Drawer, Form, Input, Modal, Popconfirm, Select, Space, Tabs, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";

type CollectionFormValues = {
    title: string;
    type: TextCollectionDto["type"];
    author?: string;
    description?: string;
    cefrLevel?: string;
};

type PassageFormValues = {
    title: string;
    type: PassageDto["type"];
    collectionId?: string;
    cefrLevel?: string;
    content: string;
};

type PassageFilters = {
    collectionId?: string;
};

const noopFiltersChange = () => {};

export function TextLibraryPage() {
    const navigateOrg = useOrgNavigate();
    const [activeTab, setActiveTab] = useState("collections");
    const [passageFilters, setPassageFilters] = useState<PassageFilters>({});
    const [collectionModalOpen, setCollectionModalOpen] = useState(false);
    const [passageModalOpen, setPassageModalOpen] = useState(false);
    const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
    const [editingPassageId, setEditingPassageId] = useState<string | null>(null);

    const { collections, isLoading: collectionsLoading } = useTextCollectionLibrary({ limit: 100 });
    const { passages, isLoading: passagesLoading } = usePassageLibrary({
        limit: 100,
        collectionId: passageFilters.collectionId,
    });

    const createCollection = useCreateTextCollection();
    const updateCollection = useUpdateTextCollection();
    const deleteCollection = useDeleteTextCollection();
    const createPassage = useCreatePassage();
    const updatePassage = useUpdatePassage();
    const deletePassage = useDeletePassage();

    const editingCollectionQuery = useTextCollectionById(editingCollectionId ?? undefined);
    const editingPassageQuery = usePassageById(editingPassageId ?? undefined);

    const [collectionForm] = Form.useForm<CollectionFormValues>();
    const [passageForm] = Form.useForm<PassageFormValues>();
    const [editCollectionForm] = Form.useForm<CollectionFormValues>();
    const [editPassageForm] = Form.useForm<PassageFormValues>();

    const collectionTitleById = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of collections) {
            map.set(c.id, c.title);
        }
        return map;
    }, [collections]);

    useEffect(() => {
        if (!editingCollectionId || !editingCollectionQuery.data) return;
        const c = editingCollectionQuery.data;
        editCollectionForm.setFieldsValue({
            title: c.title,
            type: c.type,
            author: c.author ?? undefined,
            description: c.description ?? undefined,
            cefrLevel: c.cefrLevel ?? undefined,
        });
    }, [editingCollectionId, editingCollectionQuery.data, editCollectionForm]);

    useEffect(() => {
        if (!editingPassageId || !editingPassageQuery.data) return;
        const p = editingPassageQuery.data;
        editPassageForm.setFieldsValue({
            title: p.title ?? "",
            type: p.type,
            collectionId: p.collectionId ?? undefined,
            cefrLevel: p.cefrLevel ?? undefined,
            content: p.content ?? defaultPassageDocJson(),
        });
    }, [editingPassageId, editingPassageQuery.data, editPassageForm]);

    const collectionColumns: ColumnsType<TextCollectionDto> = useMemo(
        () => [
            { title: "Title", dataIndex: "title", key: "title" },
            {
                title: "Type",
                dataIndex: "type",
                key: "type",
                render: (type: string) => <Tag>{type}</Tag>,
            },
            { title: "Author", dataIndex: "author", key: "author", render: (v) => v ?? "—" },
        ],
        []
    );

    const passageColumns: ColumnsType<PassageDto> = useMemo(
        () => [
            {
                title: "Title",
                dataIndex: "title",
                key: "title",
                render: (title, row) => (
                    <Button
                        type="link"
                        className="!p-0"
                        onClick={() => setEditingPassageId(row.id)}
                    >
                        {title ?? "(Untitled)"}
                    </Button>
                ),
            },
            {
                title: "Collection",
                dataIndex: "collectionId",
                key: "collectionId",
                render: (id: string | null) =>
                    id ? (collectionTitleById.get(id) ?? id) : <Tag>Standalone</Tag>,
            },
            {
                title: "Type",
                dataIndex: "type",
                key: "type",
                render: (type: string) => <Tag>{type}</Tag>,
            },
            {
                title: "Words",
                dataIndex: "wordCount",
                key: "wordCount",
                render: (n) => n ?? "—",
            },
        ],
        [collectionTitleById]
    );

    const collectionSelectOptions = collections.map((c) => ({
        value: c.id,
        label: c.title,
    }));

    return (
        <PageShell>
            <PageHeader
                title="Text library"
                subtitle="Manage collections (books/readers) and passages. Link passages to a collection when creating or editing."
                actions={
                    <Button
                        icon={<UploadOutlined />}
                        onClick={() => navigateOrg(AppRoutes.org.teaching.textLibraryImport)}
                    >
                        Import book
                    </Button>
                }
            />
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "collections",
                        label: "Collections",
                        children: (
                            <Space direction="vertical" className="w-full" size="middle">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setCollectionModalOpen(true)}
                                >
                                    New collection
                                </Button>
                                <DataTableWithFilters<TextCollectionDto>
                                    config={{
                                        columns: collectionColumns,
                                        data: collections,
                                        loading: collectionsLoading,
                                        rowKey: "id",
                                        filters: [],
                                        onFiltersChange: noopFiltersChange,
                                        pagination: null,
                                        actions: (row) => (
                                            <Space>
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    aria-label="Edit collection"
                                                    onClick={() => setEditingCollectionId(row.id)}
                                                />
                                                <Popconfirm
                                                    title="Delete this collection?"
                                                    onConfirm={() =>
                                                        deleteCollection.mutate(row.id)
                                                    }
                                                >
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        aria-label="Delete"
                                                    />
                                                </Popconfirm>
                                            </Space>
                                        ),
                                    }}
                                />
                            </Space>
                        ),
                    },
                    {
                        key: "passages",
                        label: "Passages",
                        children: (
                            <Space direction="vertical" className="w-full" size="middle">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        passageForm.setFieldsValue({
                                            type: "reading",
                                            content: defaultPassageDocJson(),
                                        });
                                        setPassageModalOpen(true);
                                    }}
                                >
                                    New passage
                                </Button>
                                <DataTableWithFilters<PassageDto>
                                    config={{
                                        columns: passageColumns,
                                        data: passages,
                                        loading: passagesLoading,
                                        rowKey: "id",
                                        filters: [
                                            {
                                                type: "select",
                                                key: "collectionId",
                                                placeholder: "Filter by collection",
                                                options: collections.map((c) => ({
                                                    value: c.id,
                                                    label: c.title,
                                                })),
                                            },
                                        ],
                                        onFiltersChange: (f) =>
                                            setPassageFilters({
                                                collectionId: f.collectionId || undefined,
                                            }),
                                        pagination: null,
                                        actions: (row) => (
                                            <Space>
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    aria-label="Edit passage"
                                                    onClick={() => setEditingPassageId(row.id)}
                                                />
                                                <Popconfirm
                                                    title="Delete this passage?"
                                                    onConfirm={() => deletePassage.mutate(row.id)}
                                                >
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        aria-label="Delete"
                                                    />
                                                </Popconfirm>
                                            </Space>
                                        ),
                                    }}
                                />
                            </Space>
                        ),
                    },
                ]}
            />

            <Modal
                title="New collection"
                open={collectionModalOpen}
                onCancel={() => {
                    setCollectionModalOpen(false);
                    collectionForm.resetFields();
                }}
                onOk={() => void collectionForm.submit()}
                confirmLoading={createCollection.isPending}
                destroyOnClose
                width={520}
            >
                <Form
                    form={collectionForm}
                    layout="vertical"
                    initialValues={{ type: "book" }}
                    onFinish={async (values) => {
                        await createCollection.mutateAsync(values);
                        setCollectionModalOpen(false);
                        collectionForm.resetFields();
                    }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Title is required" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select
                            options={TEXT_COLLECTION_TYPES.map((t) => ({ value: t, label: t }))}
                        />
                    </Form.Item>
                    <Form.Item name="author" label="Author">
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="cefrLevel" label="CEFR level">
                        <Select
                            allowClear
                            options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="New passage"
                open={passageModalOpen}
                onCancel={() => {
                    setPassageModalOpen(false);
                    passageForm.resetFields();
                }}
                onOk={() => void passageForm.submit()}
                confirmLoading={createPassage.isPending}
                destroyOnClose
                width={720}
            >
                <Form
                    form={passageForm}
                    layout="vertical"
                    initialValues={{ type: "reading", content: defaultPassageDocJson() }}
                    onFinish={async (values) => {
                        await createPassage.mutateAsync({
                            title: values.title,
                            type: values.type,
                            cefrLevel: values.cefrLevel,
                            collectionId: values.collectionId || undefined,
                            content: values.content,
                        });
                        setPassageModalOpen(false);
                        passageForm.resetFields();
                    }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Title is required" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="collectionId" label="Collection (optional)">
                        <Select allowClear options={collectionSelectOptions} />
                    </Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select options={PASSAGE_TYPES.map((t) => ({ value: t, label: t }))} />
                    </Form.Item>
                    <Form.Item name="cefrLevel" label="CEFR level">
                        <Select
                            allowClear
                            options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="Content"
                        rules={[{ required: true, message: "Content is required" }]}
                    >
                        <PassageContentEditor />
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title="Edit collection"
                open={editingCollectionId != null}
                onClose={() => {
                    setEditingCollectionId(null);
                    editCollectionForm.resetFields();
                }}
                width={520}
                extra={
                    <Button
                        type="primary"
                        loading={updateCollection.isPending}
                        onClick={() => void editCollectionForm.submit()}
                    >
                        Save
                    </Button>
                }
            >
                {editingCollectionQuery.isLoading ? (
                    <span>Loading…</span>
                ) : (
                    <Form
                        form={editCollectionForm}
                        layout="vertical"
                        onFinish={async (values) => {
                            if (!editingCollectionId) return;
                            await updateCollection.mutateAsync({
                                collectionId: editingCollectionId,
                                ...values,
                            });
                            setEditingCollectionId(null);
                        }}
                    >
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[{ required: true, message: "Title is required" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                            <Select
                                options={TEXT_COLLECTION_TYPES.map((t) => ({
                                    value: t,
                                    label: t,
                                }))}
                            />
                        </Form.Item>
                        <Form.Item name="author" label="Author">
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item name="cefrLevel" label="CEFR level">
                            <Select
                                allowClear
                                options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
                            />
                        </Form.Item>
                    </Form>
                )}
            </Drawer>

            <Drawer
                title={editingPassageQuery.data?.title ?? "Edit passage"}
                open={editingPassageId != null}
                onClose={() => {
                    setEditingPassageId(null);
                    editPassageForm.resetFields();
                }}
                width={720}
                extra={
                    <Button
                        type="primary"
                        loading={updatePassage.isPending}
                        onClick={() => void editPassageForm.submit()}
                    >
                        Save
                    </Button>
                }
            >
                {editingPassageQuery.isLoading ? (
                    <span>Loading…</span>
                ) : (
                    <Form
                        form={editPassageForm}
                        layout="vertical"
                        onFinish={async (values) => {
                            if (!editingPassageId) return;
                            await updatePassage.mutateAsync({
                                passageId: editingPassageId,
                                title: values.title,
                                type: values.type,
                                cefrLevel: values.cefrLevel ?? null,
                                collectionId: values.collectionId ?? null,
                                content: values.content,
                            });
                            setEditingPassageId(null);
                        }}
                    >
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[{ required: true, message: "Title is required" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="collectionId" label="Collection">
                            <Select allowClear options={collectionSelectOptions} />
                        </Form.Item>
                        <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                            <Select options={PASSAGE_TYPES.map((t) => ({ value: t, label: t }))} />
                        </Form.Item>
                        <Form.Item name="cefrLevel" label="CEFR level">
                            <Select
                                allowClear
                                options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
                            />
                        </Form.Item>
                        <Form.Item name="content" label="Content" rules={[{ required: true }]}>
                            <PassageContentEditor />
                        </Form.Item>
                        {editingPassageQuery.data?.content ? (
                            <p className="text-xs text-slate-500 m-0">
                                Preview:{" "}
                                {plainTextFromPassageContent(
                                    editingPassageQuery.data.content
                                ).slice(0, 120)}
                                …
                            </p>
                        ) : null}
                    </Form>
                )}
            </Drawer>
        </PageShell>
    );
}
