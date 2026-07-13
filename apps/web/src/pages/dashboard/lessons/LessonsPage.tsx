import {
    BookOutlined,
    DeleteOutlined,
    EditOutlined,
    PictureOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { getAssetUrl } from "@shared";
import { CEFR_LEVELS } from "@shared/constants/cefr";
import type { CursorPaginationConfig } from "@web/src/components/data/DataTable.types";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { TableEmptyState } from "@web/src/components/data/TableEmptyState";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
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
import { DateUtils } from "@web/src/utils/date";
import {
    Avatar,
    Button,
    Card,
    Drawer,
    Form,
    Input,
    List,
    Popconfirm,
    Select,
    Space,
    Tag,
    Tooltip,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

const { Text } = Typography;

export const LessonsPage: React.FC = () => {
    const navigate = useNavigate();
    const { isStaff } = useOrgRole();
    const { activeOrganization } = useOrganization();
    const orgSlug = activeOrganization?.slug;

    const lessonDetailHref = (lessonId: string) =>
        orgSlug ? `/org/${orgSlug}/teaching/lessons/${lessonId}` : null;
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
        <PageShell>
            <PageHeader
                title="Lessons"
                subtitle={
                    isStaff
                        ? "Manage reusable lessons for future sessions."
                        : "Your enrolled lesson sessions."
                }
                actions={
                    isStaff ? (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateDrawerOpen(true)}
                            size="large"
                        >
                            Create Lesson
                        </Button>
                    ) : undefined
                }
            />

            {isStaff ? (
                <div className="flex-1 min-h-0">
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
                            onRowClick: (record) => {
                                const href = lessonDetailHref(record.id);
                                if (href) navigate(href);
                            },
                            actions: (record: LessonDto) => {
                                const editHref = lessonDetailHref(record.id);
                                return (
                                    <Space>
                                        {editHref ? (
                                            <Tooltip title="Edit lesson">
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={() => navigate(editHref)}
                                                />
                                            </Tooltip>
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
                                );
                            },
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
            ) : (
                <StudentLessonsList
                    enrollments={myEnrollments}
                    loading={isLoadingMyEnrollments}
                    orgSlug={orgSlug}
                />
            )}

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
        </PageShell>
    );
};

type EnrollmentRow = {
    sessionId: string;
    lessonId: string;
    lessonTitle: string;
    teacherName?: string | null;
    startTime: string;
    endTime: string;
    sessionStatus: string;
    enrollmentStatus: string;
};

function StudentLessonsList({
    enrollments,
    loading,
    orgSlug,
}: {
    enrollments: EnrollmentRow[] | undefined;
    loading: boolean;
    orgSlug?: string;
}) {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const rows = enrollments ?? [];

    const sorted = useMemo(
        () =>
            [...rows].sort(
                (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            ),
        [rows]
    );

    if (!loading && sorted.length === 0) {
        return (
            <Card className="border-0 shadow-sm">
                <TableEmptyState
                    icon={<BookOutlined />}
                    title="No lessons yet"
                    subtitle="When your school enrolls you in sessions, they will show up here."
                    action={
                        orgSlug ? (
                            <Button
                                type="primary"
                                onClick={() => navigate(`/org/${orgSlug}/dashboard`)}
                            >
                                Back to home
                            </Button>
                        ) : undefined
                    }
                />
            </Card>
        );
    }

    return (
        <List
            loading={loading}
            dataSource={sorted}
            className="bg-transparent"
            renderItem={(item) => {
                const href = orgSlug
                    ? `/org/${orgSlug}/dashboard/lessons/${item.lessonId}`
                    : undefined;
                return (
                    <List.Item
                        className="!px-4 !py-4 mb-3 rounded-lg shadow-sm cursor-pointer"
                        style={{
                            backgroundColor: token.colorBgContainer,
                            border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                        onClick={() => href && navigate(href)}
                        actions={[
                            <Button
                                key="open"
                                type="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (href) navigate(href);
                                }}
                            >
                                Open lesson
                            </Button>,
                        ]}
                    >
                        <List.Item.Meta
                            title={<Text strong>{item.lessonTitle}</Text>}
                            description={
                                <Space direction="vertical" size={2}>
                                    <Text type="secondary">
                                        {DateUtils.format(item.startTime, "ddd, MMM D · h:mm A")} –{" "}
                                        {DateUtils.format(item.endTime, "h:mm A")}
                                    </Text>
                                    <Space size={8} wrap>
                                        <Text type="secondary">
                                            Teacher: {item.teacherName || "Unassigned"}
                                        </Text>
                                        <Tag>{item.sessionStatus}</Tag>
                                        <Tag>{item.enrollmentStatus}</Tag>
                                    </Space>
                                </Space>
                            }
                        />
                    </List.Item>
                );
            }}
        />
    );
}
