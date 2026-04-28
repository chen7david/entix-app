import { DeleteOutlined, EditOutlined, PictureOutlined, PlusOutlined } from "@ant-design/icons";
import { getAssetUrl } from "@shared";
import type { CursorPaginationConfig } from "@web/src/components/data/DataTableWithFilters";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useAuth } from "@web/src/features/auth";
import {
    type LessonDto,
    useCreateLesson,
    useDeleteLesson,
    useLessonLibrary,
    useLessons,
    useUpdateLesson,
} from "@web/src/features/lessons/hooks/useLessons";
import { CoverArtUploader } from "@web/src/features/media";
import { useOrganization } from "@web/src/features/organization";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import {
    Avatar,
    Button,
    Card,
    Drawer,
    Form,
    Input,
    Popconfirm,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import type React from "react";
import { useMemo, useState } from "react";

const { Text } = Typography;

export const LessonsPage: React.FC = () => {
    const { isStaff } = useAuth();
    const { activeOrganization } = useOrganization();
    const { myEnrollments, isLoadingMyEnrollments } = useLessons();
    const createLesson = useCreateLesson();
    const updateLesson = useUpdateLesson();
    const deleteLesson = useDeleteLesson();
    const [filters, setFilters] = useState<{ search?: string }>({});
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [pageSize, setPageSize] = useState(10);
    const [direction, setDirection] = useState<"next" | "prev">("next");
    const { lessons, nextCursor, isLoadingLessons } = useLessonLibrary({
        search: filters.search,
        cursor,
        limit: pageSize,
        direction,
    });

    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonDto | null>(null);
    const initialTableFilters = useMemo(() => ({}), []);

    const handleCreate = async () => {
        const values = await createForm.validateFields();
        await createLesson.mutateAsync({
            title: values.title,
            description: values.description,
            coverArtUploadId: values.coverArtUploadId,
        });
        createForm.resetFields();
        setIsCreateDrawerOpen(false);
    };

    const handleUpdate = async () => {
        if (!editingLesson) return;
        const values = await editForm.validateFields();
        await updateLesson.mutateAsync({
            lessonId: editingLesson.id,
            title: values.title,
            description: values.description,
            coverArtUploadId: values.coverArtUploadId,
        });
        setEditingLesson(null);
        editForm.resetFields();
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

    return (
        <div>
            <PageHeader
                title="Lessons"
                subtitle={
                    isStaff
                        ? "Manage reusable lessons for future sessions."
                        : "Your upcoming and past lesson sessions."
                }
                actions={
                    isStaff ? (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateDrawerOpen(true)}
                            size="large"
                            className="h-11 font-semibold transition-all duration-200"
                        >
                            Create Lesson
                        </Button>
                    ) : undefined
                }
            />

            {isStaff ? (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <div className="h-[calc(100dvh-220px)]">
                        <DataTableWithFilters
                            config={{
                                columns: [
                                    {
                                        title: "Cover",
                                        key: "coverArtUrl",
                                        width: 90,
                                        render: (_: unknown, record: LessonDto) =>
                                            record.coverArtUrl ? (
                                                <Avatar
                                                    shape="square"
                                                    size={40}
                                                    src={getAssetUrl(record.coverArtUrl)}
                                                />
                                            ) : (
                                                <Avatar
                                                    shape="square"
                                                    size={40}
                                                    icon={<PictureOutlined />}
                                                />
                                            ),
                                    },
                                    {
                                        title: "Title",
                                        dataIndex: "title",
                                        key: "title",
                                        width: 260,
                                    },
                                    {
                                        title: "Description",
                                        dataIndex: "description",
                                        key: "description",
                                        render: (value: string | null) => value || "No description",
                                    },
                                    {
                                        title: "Updated",
                                        dataIndex: "updatedAt",
                                        key: "updatedAt",
                                        width: 180,
                                        render: (value: number) => new Date(value).toLocaleString(),
                                    },
                                ],
                                data: lessons,
                                loading: isLoadingLessons,
                                rowKey: "id",
                                filters: [
                                    {
                                        type: "search",
                                        key: "q",
                                        placeholder: "Search lessons...",
                                    },
                                ],
                                actions: (record: LessonDto) => (
                                    <Space>
                                        <Tooltip title="Edit lesson">
                                            <Button
                                                type="text"
                                                icon={<EditOutlined />}
                                                onClick={() => {
                                                    setEditingLesson(record);
                                                    editForm.setFieldsValue({
                                                        title: record.title,
                                                        description: record.description,
                                                        coverArtUploadId: undefined,
                                                    });
                                                }}
                                            />
                                        </Tooltip>
                                        <Popconfirm
                                            title="Delete lesson?"
                                            onConfirm={() => deleteLesson.mutate(record.id)}
                                        >
                                            <Button
                                                danger
                                                type="text"
                                                icon={<DeleteOutlined />}
                                                loading={deleteLesson.isPending}
                                            />
                                        </Popconfirm>
                                    </Space>
                                ),
                                onFiltersChange: (newFilters) => {
                                    setFilters({
                                        search: newFilters.q || undefined,
                                    });
                                    setCursor(undefined);
                                    setCursorStack([]);
                                    setDirection("next");
                                },
                                pagination: tablePagination,
                                initialFilters: initialTableFilters,
                            }}
                        />
                    </div>

                    <Drawer
                        title="Create Lesson"
                        placement="right"
                        width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                        open={isCreateDrawerOpen}
                        destroyOnClose
                        onClose={() => {
                            setIsCreateDrawerOpen(false);
                            createForm.resetFields();
                        }}
                        extra={
                            <Button
                                type="primary"
                                onClick={() => createForm.submit()}
                                loading={createLesson.isPending}
                            >
                                Create Lesson
                            </Button>
                        }
                    >
                        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
                            <Form.Item
                                name="title"
                                label="Title"
                                rules={[{ required: true, message: "Lesson title is required" }]}
                            >
                                <Input placeholder="Lesson title" />
                            </Form.Item>
                            <Form.Item name="description" label="Description">
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Optional lesson description"
                                />
                            </Form.Item>
                            <Form.Item name="coverArtUploadId" hidden>
                                <Input />
                            </Form.Item>
                            {activeOrganization?.id && (
                                <CoverArtUploader
                                    organizationId={activeOrganization.id}
                                    onUploadSuccess={async (uploadId) => {
                                        createForm.setFieldsValue({ coverArtUploadId: uploadId });
                                    }}
                                    aspectRatio={1}
                                />
                            )}
                        </Form>
                    </Drawer>

                    <Drawer
                        title="Edit Lesson"
                        placement="right"
                        width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                        open={!!editingLesson}
                        destroyOnClose
                        onClose={() => {
                            setEditingLesson(null);
                            editForm.resetFields();
                        }}
                        extra={
                            <Button
                                type="primary"
                                onClick={() => editForm.submit()}
                                loading={updateLesson.isPending}
                            >
                                Save Changes
                            </Button>
                        }
                    >
                        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
                            <Form.Item
                                name="title"
                                label="Title"
                                rules={[{ required: true, message: "Lesson title is required" }]}
                            >
                                <Input placeholder="Lesson title" />
                            </Form.Item>
                            <Form.Item name="description" label="Description">
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Optional lesson description"
                                />
                            </Form.Item>
                            <Form.Item name="coverArtUploadId" hidden>
                                <Input />
                            </Form.Item>
                            {activeOrganization?.id && (
                                <CoverArtUploader
                                    organizationId={activeOrganization.id}
                                    currentImageUrl={
                                        editingLesson?.coverArtUrl
                                            ? getAssetUrl(editingLesson.coverArtUrl)
                                            : undefined
                                    }
                                    onUploadSuccess={async (uploadId) => {
                                        editForm.setFieldsValue({ coverArtUploadId: uploadId });
                                    }}
                                    aspectRatio={1}
                                />
                            )}
                        </Form>
                    </Drawer>
                </Space>
            ) : (
                <Card title="My Lesson Sessions">
                    <Table
                        rowKey={(row) => row.sessionId}
                        loading={isLoadingMyEnrollments}
                        dataSource={myEnrollments}
                        pagination={false}
                        locale={{ emptyText: "No lesson sessions yet" }}
                        columns={[
                            {
                                title: "Lesson",
                                dataIndex: "lessonTitle",
                            },
                            {
                                title: "Teacher",
                                dataIndex: "teacherName",
                            },
                            {
                                title: "Start",
                                dataIndex: "startTime",
                                render: (value: string) => new Date(value).toLocaleString(),
                            },
                            {
                                title: "End",
                                dataIndex: "endTime",
                                render: (value: string) => new Date(value).toLocaleString(),
                            },
                            {
                                title: "Session Status",
                                dataIndex: "sessionStatus",
                                render: (value: string) => <Tag>{value}</Tag>,
                            },
                            {
                                title: "Enrollment",
                                dataIndex: "enrollmentStatus",
                                render: (value: string) => <Text>{value}</Text>,
                            },
                        ]}
                    />
                </Card>
            )}
        </div>
    );
};
