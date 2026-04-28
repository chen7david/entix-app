import { DeleteOutlined } from "@ant-design/icons";
import { useAuth } from "@web/src/features/auth";
import { useLessons } from "@web/src/features/lessons/hooks/useLessons";
import {
    Button,
    Card,
    Empty,
    Form,
    Input,
    List,
    Popconfirm,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import type React from "react";

const { Title, Paragraph, Text } = Typography;

export const LessonsPage: React.FC = () => {
    const { isStaff } = useAuth();
    const {
        lessons,
        myEnrollments,
        isLoadingLessons,
        isLoadingMyEnrollments,
        createLesson,
        deleteLesson,
    } = useLessons();
    const [form] = Form.useForm();

    const handleCreate = async () => {
        const values = await form.validateFields();
        await createLesson.mutateAsync({
            title: values.title,
            description: values.description,
        });
        form.resetFields();
    };

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Lessons
                </Title>
                <Paragraph type="secondary">
                    {isStaff
                        ? "Manage reusable lessons for future sessions."
                        : "Your upcoming and past lesson sessions."}
                </Paragraph>
            </div>

            {isStaff ? (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card title="Create Lesson">
                        <Form form={form} layout="vertical" onFinish={handleCreate}>
                            <Form.Item
                                name="title"
                                label="Title"
                                rules={[{ required: true, message: "Lesson title is required" }]}
                            >
                                <Input placeholder="Lesson title" />
                            </Form.Item>
                            <Form.Item name="description" label="Description">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Optional lesson description"
                                />
                            </Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={createLesson.isPending}
                            >
                                Create Lesson
                            </Button>
                        </Form>
                    </Card>

                    <Card title="Lesson Library">
                        {lessons.length === 0 ? (
                            <Empty description="No lessons created yet" />
                        ) : (
                            <List
                                loading={isLoadingLessons}
                                dataSource={lessons}
                                renderItem={(lesson) => (
                                    <List.Item
                                        actions={[
                                            <Popconfirm
                                                key="delete"
                                                title="Delete lesson?"
                                                onConfirm={() => deleteLesson.mutate(lesson.id)}
                                            >
                                                <Button
                                                    danger
                                                    type="text"
                                                    icon={<DeleteOutlined />}
                                                    loading={deleteLesson.isPending}
                                                >
                                                    Delete
                                                </Button>
                                            </Popconfirm>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={lesson.title}
                                            description={lesson.description || "No description"}
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
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
