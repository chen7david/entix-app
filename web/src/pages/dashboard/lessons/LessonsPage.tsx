import { DeleteOutlined, PictureOutlined, PlusOutlined } from "@ant-design/icons";
import { getAssetUrl } from "@shared";
import { CEFR_LEVELS } from "@shared/constants/cefr";
import type { CursorPaginationConfig } from "@web/src/components/data/DataTableWithFilters";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import {
    type LessonDto,
    useCreateLesson,
    useDeleteLesson,
    useLessonLibrary,
    useLessons,
} from "@web/src/features/lessons/hooks/useLessons";
import { CoverArtUploader } from "@web/src/features/media";
import { useOrganization, useOrgRole } from "@web/src/features/organization";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import {
    Avatar,
    Button,
    Card,
    Drawer,
    Form,
    Input,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const { Text } = Typography;

export const LessonsPage: React.FC = () => {
    const { isStaff } = useOrgRole();
    const { activeOrganization } = useOrganization();
    const orgSlug = activeOrganization?.slug;
    const { myEnrollments, isLoadingMyEnrollments } = useLessons();
    const createLesson = useCreateLesson();
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
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const initialTableFilters = useMemo(() => ({}), []);

    const handleCreate = async () => {
        const values = await createForm.validateFields();
        await createLesson.mutateAsync({
            title: values.title,
            description: values.description,
            coverArtUploadId: values.coverArtUploadId,
            cefrLevel: values.cefrLevel ?? null,
        });
        createForm.resetFields();
        setIsCreateDrawerOpen(false);
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
                                        title: "CEFR",
                                        dataIndex: "cefrLevel",
                                        key: "cefrLevel",
                                        width: 88,
                                        render: (value: string | null) =>
                                            value ? (
                                                <Tag>{value}</Tag>
                                            ) : (
                                                <Text type="secondary">—</Text>
                                            ),
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
                                        {orgSlug ? (
                                            <Link
                                                to={`/org/${orgSlug}/teaching/lessons/${record.id}`}
                                            >
                                                Detail
                                            </Link>
                                        ) : null}
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
                                render: (title: string, record) =>
                                    orgSlug ? (
                                        <Link
                                            to={`/org/${orgSlug}/dashboard/lessons/${record.lessonId}`}
                                        >
                                            {title}
                                        </Link>
                                    ) : (
                                        title
                                    ),
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
