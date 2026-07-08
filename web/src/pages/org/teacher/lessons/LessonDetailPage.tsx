import { HolderOutlined } from "@ant-design/icons";
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getAssetUrl } from "@shared";
import { CEFR_LEVELS, type CefrLevel } from "@shared/constants/cefr";
import { AddObjectiveForm } from "@web/src/features/lessons/components/AddObjectiveForm";
import {
    LessonStudyContent,
    type LessonStudyEditSection,
} from "@web/src/features/lessons/components/LessonStudyContent";
import {
    type LessonPassageRowDto,
    type LessonPlaylistRowDto,
    type ObjectiveDto,
    useAddLessonPassage,
    useAddLessonPlaylist,
    useAddLessonVocabulary,
    useCreateBankVocabularyWord,
    useLessonObjectives,
    useLessonPassages,
    useLessonPlaylists,
    useLessonVocabulary,
    useRemoveLessonPassage,
    useRemoveLessonPlaylist,
    useRemoveLessonVocabulary,
    useReorderLessonObjectives,
    useReorderLessonPassages,
    useReorderLessonPlaylists,
    useReplaceObjectives,
} from "@web/src/features/lessons/hooks/useLessonContent";
import { useLessonById, useUpdateLesson } from "@web/src/features/lessons/hooks/useLessons";
import { CoverArtUploader } from "@web/src/features/media";
import { usePlaylist, usePlaylists } from "@web/src/features/media/hooks/usePlaylists";
import { useOrganization } from "@web/src/features/organization";
import { usePassageLibrary } from "@web/src/features/passages";
import { AddVocabularyForm } from "@web/src/features/vocabulary/components/AddVocabularyForm";
import { VocabularyTable } from "@web/src/features/vocabulary/components/VocabularyTable";
import { useLessonVocabularyBankItems } from "@web/src/features/vocabulary/hooks/useLessonVocabularyBankItems";
import type { VocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";
import { dedupeSessionVocabularyByWord } from "@web/src/features/vocabulary/utils/sessionVocabularyDisplay";
import { WordListPrintButton } from "@web/src/reports";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import {
    App,
    Button,
    Drawer,
    Empty,
    Form,
    Input,
    Popconfirm,
    Select,
    Space,
    Tooltip,
    Typography,
} from "antd";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

/** Click the row (not the handle or Delete) to edit that objective in the drawer. */
function LessonObjectiveSortableRow(props: {
    objective: ObjectiveDto;
    onTileClick: () => void;
    onDelete: () => void;
    deleteLoading?: boolean;
}): React.ReactElement {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props.objective.id,
    });
    const { onPointerDown: sortablePointerDown, ...handleListeners } =
        listeners as typeof listeners & {
            onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
        };
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : ("auto" as const),
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={props.onTileClick}
            className={`flex items-center gap-3 px-4 py-3 mb-3 rounded-xl border cursor-pointer text-left w-full ${
                isDragging
                    ? "border-[#646cff] bg-indigo-50 dark:bg-[#646cff]/10 shadow-xl ring-2 ring-[#646cff]/20"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            } transition-all group`}
        >
            <div
                {...attributes}
                {...handleListeners}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                    sortablePointerDown?.(e);
                    e.stopPropagation();
                }}
            >
                <HolderOutlined />
            </div>
            <Typography.Text className="flex-1 min-w-0">
                {props.objective.objective}
            </Typography.Text>
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                    title="Remove this objective?"
                    okText="Remove"
                    okButtonProps={{ danger: true, loading: props.deleteLoading }}
                    onConfirm={props.onDelete}
                >
                    <Button
                        danger
                        type="link"
                        size="small"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Delete
                    </Button>
                </Popconfirm>
            </div>
        </div>
    );
}

function LessonPassageSortableRow(props: {
    row: LessonPassageRowDto;
    onRemove: () => void;
}): React.ReactElement {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props.row.passageId,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : ("auto" as const),
    };
    const title = props.row.title ?? "(Untitled passage)";
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between px-4 py-3 mb-3 rounded-xl border ${
                isDragging
                    ? "border-[#646cff] bg-indigo-50 dark:bg-[#646cff]/10 shadow-xl ring-2 ring-[#646cff]/20"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            } transition-all group`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <HolderOutlined />
                </div>
                <Tooltip title={`ID: ${props.row.passageId}`}>
                    <div className="flex flex-col flex-1 min-w-0">
                        <Typography.Text strong className="truncate">
                            {title}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="text-xs">
                            {props.row.type}
                            {props.row.wordCount != null ? ` · ${props.row.wordCount} words` : ""}
                        </Typography.Text>
                    </div>
                </Tooltip>
            </div>
            <Popconfirm title="Remove passage?" okText="Remove" onConfirm={props.onRemove}>
                <Button
                    danger
                    type="link"
                    size="small"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    Delete
                </Button>
            </Popconfirm>
        </div>
    );
}

function LessonPlaylistSortableRow(props: {
    row: LessonPlaylistRowDto;
    onRemove: () => void;
}): React.ReactElement {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props.row.playlistId,
    });
    const playlistQuery = usePlaylist(props.row.playlistId);
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : ("auto" as const),
    };
    const title = playlistQuery.data?.title ?? (playlistQuery.isPending ? "…" : "Playlist");
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between px-4 py-3 mb-3 rounded-xl border ${
                isDragging
                    ? "border-[#646cff] bg-indigo-50 dark:bg-[#646cff]/10 shadow-xl ring-2 ring-[#646cff]/20"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            } transition-all group`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <HolderOutlined />
                </div>
                <Tooltip title={`ID: ${props.row.playlistId}`}>
                    <div className="flex flex-col flex-1 min-w-0">
                        <Typography.Text strong className="truncate">
                            {title}
                        </Typography.Text>
                        {playlistQuery.data?.description ? (
                            <Typography.Text type="secondary" className="text-xs truncate">
                                {playlistQuery.data.description}
                            </Typography.Text>
                        ) : null}
                        <Typography.Text type="secondary" className="text-xs">
                            Linked {new Date(props.row.addedAt).toLocaleString()}
                        </Typography.Text>
                    </div>
                </Tooltip>
            </div>
            <Popconfirm title="Remove playlist?" okText="Remove" onConfirm={props.onRemove}>
                <Button
                    danger
                    type="link"
                    size="small"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    Delete
                </Button>
            </Popconfirm>
        </div>
    );
}

export function LessonDetailPage(): React.ReactElement | null {
    /** Matches parent route in App.tsx (`org/:slug/...`). */
    const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
    const { notification } = App.useApp();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    const lessonQuery = useLessonById(organizationId, lessonId);
    const updateLesson = useUpdateLesson();

    const objectivesQuery = useLessonObjectives(organizationId, lessonId);
    const replaceObjectives = useReplaceObjectives();
    const reorderObjectivesMutation = useReorderLessonObjectives();

    const playlistsQuery = useLessonPlaylists(organizationId, lessonId);
    const addPlaylist = useAddLessonPlaylist();
    const removePlaylist = useRemoveLessonPlaylist();
    const reorderPlaylistsMutation = useReorderLessonPlaylists();

    const passagesQuery = useLessonPassages(organizationId, lessonId);
    const addPassage = useAddLessonPassage();
    const removePassage = useRemoveLessonPassage();
    const reorderPassagesMutation = useReorderLessonPassages();

    const vocabularyQuery = useLessonVocabulary(organizationId, lessonId);
    const addVocabulary = useAddLessonVocabulary();
    const removeVocabulary = useRemoveLessonVocabulary();
    const createBankWord = useCreateBankVocabularyWord();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [playlistSearch, setPlaylistSearch] = useState("");
    const { playlistsResponse } = usePlaylists({ search: playlistSearch || undefined });
    const { passages: passageLibrary } = usePassageLibrary({ limit: 100 });
    const [passageForm] = Form.useForm<{ passageId: string }>();

    const [objectiveEditDrawerOpen, setObjectiveEditDrawerOpen] = useState(false);
    const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null);
    const [objectiveEditForm] = Form.useForm<{ text: string }>();

    const [playlistForm] = Form.useForm<{ playlistId: string }>();

    const [editPanel, setEditPanel] = useState<LessonStudyEditSection | null>(null);
    const [lessonEditOpen, setLessonEditOpen] = useState(false);
    const [editLessonForm] = Form.useForm<{
        title: string;
        description?: string;
        coverArtUploadId?: string;
        cefrLevel?: CefrLevel;
    }>();

    const teachingLessonsHref = slug ? `/org/${slug}/teaching/lessons` : "/";

    const objectivesSorted = useMemo(
        () => [...(objectivesQuery.data ?? [])].sort((a, b) => a.position - b.position),
        [objectivesQuery.data]
    );
    const lessonPlaylistsSorted = useMemo(
        () => [...(playlistsQuery.data ?? [])].sort((a, b) => a.position - b.position),
        [playlistsQuery.data]
    );
    const { tableItems: lessonVocabTableItems, isLoading: lessonVocabBankLoading } =
        useLessonVocabularyBankItems({
            organizationId,
            lessonId,
            vocabularyRows: vocabularyQuery.data ?? [],
            itemIdPrefix: "lesson",
        });
    const lessonPassagesSorted = useMemo(
        () => [...(passagesQuery.data ?? [])].sort((a, b) => a.position - b.position),
        [passagesQuery.data]
    );
    const linkedPassageIds = useMemo(
        () => new Set(lessonPassagesSorted.map((r) => r.passageId)),
        [lessonPassagesSorted]
    );

    const handleAddLessonWord = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || !organizationId || !lessonId) return;
            let vocabulary: VocabularyItemDTO;
            try {
                const created = await createBankWord.mutateAsync({
                    organizationId,
                    text: trimmed,
                });
                vocabulary = created.vocabulary;
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Something went wrong";
                notification.error({
                    message: "Could not create or find this word",
                    description: msg,
                });
                return;
            }
            try {
                await addVocabulary.mutateAsync({
                    organizationId,
                    lessonId,
                    vocabularyId: vocabulary.id,
                });
            } catch {
                return;
            }
            const processing =
                vocabulary.status === "new" ||
                vocabulary.status.startsWith("queued") ||
                vocabulary.status.startsWith("processing");
            notification.success({
                message: "Word added to this lesson",
                description: processing
                    ? "Translations and audio will appear when processing completes."
                    : undefined,
            });
        },
        [organizationId, lessonId, createBankWord, addVocabulary, notification]
    );

    const handleLinkPlaylist = useCallback(
        async (playlistId: string) => {
            if (!organizationId || !lessonId) return;
            await addPlaylist.mutateAsync({
                organizationId,
                lessonId,
                playlistId,
            });
            playlistForm.resetFields();
            notification.success({ message: "Playlist linked" });
        },
        [organizationId, lessonId, addPlaylist, playlistForm, notification]
    );

    const handleLinkPassage = useCallback(
        async (passageId: string) => {
            if (!organizationId || !lessonId) return;
            await addPassage.mutateAsync({
                organizationId,
                lessonId,
                passageId,
            });
            passageForm.resetFields();
            notification.success({ message: "Passage linked" });
        },
        [organizationId, lessonId, addPassage, passageForm, notification]
    );

    const handleAddObjective = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || !organizationId || !lessonId) return;
            const current = objectivesSorted.map((o) => o.objective);
            if (current.length >= 50) {
                notification.warning({
                    message: "Objective limit reached",
                    description: "You can add up to 50 objectives per lesson.",
                });
                return;
            }
            if (current.some((t) => t === trimmed)) {
                notification.warning({
                    message: "Already on the list",
                    description: "That objective text is already listed.",
                });
                return;
            }
            await replaceObjectives.mutateAsync({
                organizationId,
                lessonId,
                objectives: [...current, trimmed],
            });
            notification.success({ message: "Objective added" });
        },
        [organizationId, lessonId, objectivesSorted, replaceObjectives, notification]
    );

    const handleDeleteObjective = useCallback(
        async (objectiveId: string) => {
            if (!organizationId || !lessonId) return;
            const next = objectivesSorted
                .filter((o) => o.id !== objectiveId)
                .map((o) => o.objective);
            await replaceObjectives.mutateAsync({
                organizationId,
                lessonId,
                objectives: next,
            });
            notification.success({ message: "Objective removed" });
        },
        [organizationId, lessonId, objectivesSorted, replaceObjectives, notification]
    );

    const handleObjectivesDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id || !organizationId || !lessonId) return;
            const items = [...objectivesSorted];
            const oldIndex = items.findIndex((o) => o.id === active.id);
            const newIndex = items.findIndex((o) => o.id === over.id);
            if (oldIndex < 0 || newIndex < 0) return;
            const orderedIds = arrayMove(items, oldIndex, newIndex).map((o) => o.id);
            void reorderObjectivesMutation.mutateAsync({ organizationId, lessonId, orderedIds });
        },
        [objectivesSorted, organizationId, lessonId, reorderObjectivesMutation]
    );

    const handlePlaylistsDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id || !organizationId || !lessonId) return;
            const items = [...lessonPlaylistsSorted];
            const oldIndex = items.findIndex((r) => r.playlistId === active.id);
            const newIndex = items.findIndex((r) => r.playlistId === over.id);
            if (oldIndex < 0 || newIndex < 0) return;
            const orderedIds = arrayMove(items, oldIndex, newIndex).map((r) => r.playlistId);
            void reorderPlaylistsMutation.mutateAsync({ organizationId, lessonId, orderedIds });
        },
        [lessonPlaylistsSorted, organizationId, lessonId, reorderPlaylistsMutation]
    );

    const handlePassagesDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id || !organizationId || !lessonId) return;
            const items = [...lessonPassagesSorted];
            const oldIndex = items.findIndex((r) => r.passageId === active.id);
            const newIndex = items.findIndex((r) => r.passageId === over.id);
            if (oldIndex < 0 || newIndex < 0) return;
            const orderedIds = arrayMove(items, oldIndex, newIndex).map((r) => r.passageId);
            void reorderPassagesMutation.mutateAsync({ organizationId, lessonId, orderedIds });
        },
        [lessonPassagesSorted, organizationId, lessonId, reorderPassagesMutation]
    );

    useEffect(() => {
        if (!lessonEditOpen || !lessonQuery.data) return;
        editLessonForm.setFieldsValue({
            title: lessonQuery.data.title,
            description: lessonQuery.data.description ?? undefined,
            coverArtUploadId: undefined,
            cefrLevel: lessonQuery.data.cefrLevel ?? undefined,
        });
    }, [lessonEditOpen, lessonQuery.data, editLessonForm]);

    useEffect(() => {
        if (!objectiveEditDrawerOpen || !editingObjectiveId) return;
        const o = objectivesSorted.find((x) => x.id === editingObjectiveId);
        if (!o) {
            setObjectiveEditDrawerOpen(false);
            setEditingObjectiveId(null);
            return;
        }
        objectiveEditForm.setFieldsValue({ text: o.objective });
    }, [objectiveEditDrawerOpen, editingObjectiveId, objectivesSorted, objectiveEditForm]);

    if (!organizationId || !lessonId || !slug) return null;

    const lessonTitle = lessonQuery.data?.title ?? "Lesson";
    const lesson = lessonQuery.data;

    const handleUpdateLesson = async () => {
        if (!lessonId) return;
        const values = await editLessonForm.validateFields();
        await updateLesson.mutateAsync({
            lessonId,
            title: values.title,
            description: values.description ?? null,
            coverArtUploadId: values.coverArtUploadId,
            cefrLevel: values.cefrLevel ?? null,
        });
        setLessonEditOpen(false);
    };

    const closeObjectiveEditDrawer = () => {
        setObjectiveEditDrawerOpen(false);
        setEditingObjectiveId(null);
    };

    const onSaveEditedObjective = async () => {
        if (!editingObjectiveId) return;
        const vals = await objectiveEditForm.validateFields();
        const trimmed = vals.text.trim();
        if (!trimmed) {
            notification.warning({
                message: "Objective text required",
                description: "Enter at least one non-space character.",
            });
            return;
        }
        const others = objectivesSorted
            .filter((o) => o.id !== editingObjectiveId)
            .map((o) => o.objective);
        if (others.some((t) => t === trimmed)) {
            notification.warning({
                message: "Duplicate objective",
                description: "Another objective already uses this wording.",
            });
            return;
        }
        const next = objectivesSorted.map((o) =>
            o.id === editingObjectiveId ? trimmed : o.objective
        );
        await replaceObjectives.mutateAsync({
            organizationId,
            lessonId,
            objectives: next,
        });
        closeObjectiveEditDrawer();
        notification.success({ message: "Objective updated" });
    };

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <Link
                to={teachingLessonsHref}
                className="text-slate-500 hover:text-indigo-600 text-sm mb-6 inline-block"
            >
                ← Back to lessons
            </Link>

            <LessonStudyContent
                organizationId={organizationId}
                lessonId={lessonId}
                slug={slug}
                playlistArea="teaching"
                onEditSection={setEditPanel}
                onEditLesson={() => setLessonEditOpen(true)}
            />

            <Drawer
                title="Edit lesson"
                placement="right"
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                open={lessonEditOpen}
                destroyOnClose
                onClose={() => {
                    setLessonEditOpen(false);
                    editLessonForm.resetFields();
                }}
                extra={
                    <Button
                        type="primary"
                        onClick={() => void handleUpdateLesson()}
                        loading={updateLesson.isPending}
                    >
                        Save changes
                    </Button>
                }
            >
                <Form form={editLessonForm} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Lesson title is required" }]}
                    >
                        <Input placeholder="Lesson title" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={4} placeholder="Optional lesson description" />
                    </Form.Item>
                    <Form.Item name="cefrLevel" label="CEFR level">
                        <Select
                            allowClear
                            placeholder="Not set"
                            options={CEFR_LEVELS.map((level) => ({
                                value: level,
                                label: level,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="coverArtUploadId" hidden>
                        <Input />
                    </Form.Item>
                    {organizationId ? (
                        <CoverArtUploader
                            organizationId={organizationId}
                            currentImageUrl={
                                lesson?.coverArtUrl ? getAssetUrl(lesson.coverArtUrl) : undefined
                            }
                            onUploadSuccess={async (uploadId) => {
                                editLessonForm.setFieldsValue({ coverArtUploadId: uploadId });
                                if (!lessonId) return;
                                const updatedLesson = await updateLesson.mutateAsync({
                                    lessonId,
                                    coverArtUploadId: uploadId,
                                });
                                editLessonForm.setFieldsValue({
                                    cefrLevel: updatedLesson.cefrLevel ?? undefined,
                                });
                            }}
                            aspectRatio={1}
                        />
                    ) : null}
                </Form>
            </Drawer>

            <Drawer
                title="Edit objectives"
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                open={editPanel === "objectives"}
                destroyOnClose={false}
                onClose={() => setEditPanel(null)}
            >
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                    <Typography.Text type="secondary">
                        Add objectives one at a time. Drag the handle on a row to reorder. Click a
                        row (except the handle or Delete) to edit.
                    </Typography.Text>
                    <AddObjectiveForm
                        isSubmitting={replaceObjectives.isPending}
                        onSubmit={handleAddObjective}
                    />
                    {objectivesQuery.isLoading ? (
                        <Typography.Text>Loading…</Typography.Text>
                    ) : objectivesSorted.length === 0 ? (
                        <Empty description="No objectives yet" />
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleObjectivesDragEnd}
                        >
                            <SortableContext
                                items={objectivesSorted.map((o) => o.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {objectivesSorted.map((o) => (
                                    <LessonObjectiveSortableRow
                                        key={o.id}
                                        objective={o}
                                        onTileClick={() => {
                                            setEditingObjectiveId(o.id);
                                            setObjectiveEditDrawerOpen(true);
                                        }}
                                        onDelete={() => void handleDeleteObjective(o.id)}
                                        deleteLoading={replaceObjectives.isPending}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </Space>
            </Drawer>

            <Drawer
                title="Edit reading passages"
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                open={editPanel === "passages"}
                destroyOnClose={false}
                onClose={() => setEditPanel(null)}
            >
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                    <Typography.Text type="secondary">
                        Link passages from your org text library. Create new passages under Content
                        → Text library if needed.
                    </Typography.Text>
                    <Form
                        layout="vertical"
                        form={passageForm}
                        onFinish={async (vals) => handleLinkPassage(vals.passageId)}
                    >
                        <Form.Item
                            name="passageId"
                            label="Link a passage"
                            rules={[{ required: true, message: "Select a passage" }]}
                        >
                            <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder="Select passage"
                                options={passageLibrary
                                    .filter((p) => !linkedPassageIds.has(p.id))
                                    .map((p) => ({
                                        label: p.title ?? p.id,
                                        value: p.id,
                                    }))}
                            />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={addPassage.isPending}>
                            Link passage
                        </Button>
                    </Form>
                    {passagesQuery.isLoading ? (
                        <Typography.Text>Loading…</Typography.Text>
                    ) : lessonPassagesSorted.length === 0 ? (
                        <Empty description="No passages linked" />
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handlePassagesDragEnd}
                        >
                            <SortableContext
                                items={lessonPassagesSorted.map((r) => r.passageId)}
                                strategy={verticalListSortingStrategy}
                            >
                                {lessonPassagesSorted.map((row) => (
                                    <LessonPassageSortableRow
                                        key={row.passageId}
                                        row={row}
                                        onRemove={() =>
                                            removePassage.mutate({
                                                organizationId,
                                                lessonId,
                                                passageId: row.passageId,
                                            })
                                        }
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </Space>
            </Drawer>

            <Drawer
                title="Edit playlists"
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                open={editPanel === "playlists"}
                destroyOnClose={false}
                onClose={() => setEditPanel(null)}
            >
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                    <Form
                        layout="vertical"
                        form={playlistForm}
                        onFinish={async (vals) => handleLinkPlaylist(vals.playlistId)}
                    >
                        <Form.Item
                            name="playlistId"
                            label="Link a playlist"
                            rules={[{ required: true, message: "Select a playlist" }]}
                        >
                            <Select
                                showSearch
                                filterOption={false}
                                onSearch={(v) => setPlaylistSearch(v)}
                                placeholder="Search playlists"
                                options={(playlistsResponse?.items ?? []).map((p) => ({
                                    label: p.title,
                                    value: p.id,
                                }))}
                            />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" loading={addPlaylist.isPending}>
                            Link playlist
                        </Button>
                    </Form>
                    {playlistsQuery.isLoading ? (
                        <Typography.Text>Loading…</Typography.Text>
                    ) : lessonPlaylistsSorted.length === 0 ? (
                        <Empty description="No playlists linked" />
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handlePlaylistsDragEnd}
                        >
                            <SortableContext
                                items={lessonPlaylistsSorted.map((r) => r.playlistId)}
                                strategy={verticalListSortingStrategy}
                            >
                                {lessonPlaylistsSorted.map((row) => (
                                    <LessonPlaylistSortableRow
                                        key={`${row.lessonId}-${row.playlistId}`}
                                        row={row}
                                        onRemove={() =>
                                            removePlaylist.mutate({
                                                organizationId,
                                                lessonId,
                                                playlistId: row.playlistId,
                                            })
                                        }
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </Space>
            </Drawer>

            <Drawer
                title="Edit vocabulary"
                width={Math.max(UI_CONSTANTS.RIGHT_DRAWER_WIDTH, 560)}
                open={editPanel === "vocabulary"}
                destroyOnClose={false}
                onClose={() => setEditPanel(null)}
                extra={
                    organizationId && lessonQuery.data ? (
                        <WordListPrintButton
                            disabled={vocabularyQuery.isLoading || lessonVocabBankLoading}
                            data={{
                                kind: "lesson",
                                lessonTitle: lessonTitle,
                                subtitleLines: [
                                    lessonQuery.data.cefrLevel != null
                                        ? `CEFR: ${lessonQuery.data.cefrLevel}`
                                        : "CEFR: Unset",
                                ],
                                words: dedupeSessionVocabularyByWord(lessonVocabTableItems).map(
                                    (row) => row.vocabulary
                                ),
                                meta: {
                                    title: "Vocabulary Word List",
                                    orgName: activeOrganization?.name ?? "Organization",
                                    logoUrl: activeOrganization?.logo ?? undefined,
                                    generatedAt: new Date(),
                                },
                            }}
                        />
                    ) : null
                }
            >
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                    <Typography.Text type="secondary">
                        Words are added to your organization vocabulary bank and linked to this
                        lesson. New words get translations and audio when processing completes.
                    </Typography.Text>
                    <AddVocabularyForm
                        isSubmitting={createBankWord.isPending || addVocabulary.isPending}
                        onSubmit={handleAddLessonWord}
                    />
                    <Typography.Text type="secondary" className="block">
                        Tap English or Chinese for audio when available. Removing a word only
                        unlinks it from this lesson.
                    </Typography.Text>
                    <VocabularyTable
                        items={lessonVocabTableItems}
                        loading={vocabularyQuery.isLoading || lessonVocabBankLoading}
                        groupByWord
                        hideStudentCountColumn
                        vocabularyTableContext="lesson"
                        onDeleteBatch={(vocabularyId) =>
                            removeVocabulary.mutate({
                                organizationId,
                                lessonId,
                                vocabularyId,
                            })
                        }
                        isDeleting={removeVocabulary.isPending}
                    />
                </Space>
            </Drawer>

            <Drawer
                title="Edit objective"
                width={480}
                destroyOnClose
                open={objectiveEditDrawerOpen}
                onClose={closeObjectiveEditDrawer}
                extra={
                    <Button
                        type="primary"
                        loading={replaceObjectives.isPending}
                        onClick={() => void onSaveEditedObjective()}
                    >
                        Save
                    </Button>
                }
            >
                <Form layout="vertical" form={objectiveEditForm}>
                    <Form.Item
                        name="text"
                        label="Objective"
                        rules={[{ required: true, message: "Enter objective text" }]}
                    >
                        <Input.TextArea rows={5} placeholder="Objective text" />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
}
