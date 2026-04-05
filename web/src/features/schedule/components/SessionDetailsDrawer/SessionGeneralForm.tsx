import { ThunderboltOutlined } from "@ant-design/icons";
import { createSessionSchema } from "@shared";
import {
    Alert,
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    Row,
    Select,
    TimePicker,
    Tooltip,
    Typography,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { createSchemaFieldRule } from "antd-zod";
import type React from "react";

const { Text } = Typography;

type SessionGeneralFormProps = {
    form: FormInstance;
    session: any | null;
    onUpdateStatus?: (
        sessionId: string,
        status: "scheduled" | "completed" | "cancelled"
    ) => Promise<void>;
    isGeneratingTitle: boolean;
    onGenerateTitle: () => Promise<void>;
};

export const SessionGeneralForm: React.FC<SessionGeneralFormProps> = ({
    form,
    session,
    onUpdateStatus,
    isGeneratingTitle,
    onGenerateTitle,
}) => {
    return (
        <>
            {session && (
                <Form.Item label="Session Status" style={{ marginBottom: 16 }}>
                    <Select
                        value={form.getFieldValue("status") || "scheduled"}
                        onChange={async (val) => {
                            form.setFieldsValue({ status: val });
                            if (onUpdateStatus) {
                                await onUpdateStatus(
                                    session.id,
                                    val as "scheduled" | "completed" | "cancelled"
                                );
                            }
                        }}
                        style={{ width: "100%" }}
                        options={[
                            { label: "Scheduled", value: "scheduled" },
                            { label: "Completed", value: "completed" },
                            { label: "Cancelled", value: "cancelled" },
                        ]}
                    />
                    <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Status auto-saves immediately. This only affects this single session.
                        </Text>
                    </div>
                </Form.Item>
            )}

            {session && form.getFieldValue("status") === "completed" && (
                <Alert
                    type="info"
                    showIcon
                    message="Marking as completed will trigger student billing logic for present attendees."
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form.Item
                name="title"
                label={
                    <div className="flex justify-between w-full items-center">
                        <span>Title</span>
                        <Tooltip title="Match session title to selected members">
                            <Button
                                type="link"
                                size="small"
                                loading={isGeneratingTitle}
                                icon={
                                    !isGeneratingTitle && (
                                        <ThunderboltOutlined style={{ color: "#faad14" }} />
                                    )
                                }
                                onClick={onGenerateTitle}
                                style={{
                                    padding: 0,
                                    height: "auto",
                                    fontSize: 12,
                                    marginLeft: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    color: "#faad14",
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>Generate</span>
                            </Button>
                        </Tooltip>
                    </div>
                }
                rules={[createSchemaFieldRule(createSessionSchema.pick({ title: true }))]}
            >
                <Input placeholder="Session Title" />
            </Form.Item>

            <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Session Context" />
            </Form.Item>

            <Row gutter={{ xs: 8, sm: 16, md: 24 }}>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="date"
                        label="Date"
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={12} md={8}>
                    <Form.Item
                        name="time"
                        label="Time"
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <TimePicker minuteStep={15} format="HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={12} md={8}>
                    <Form.Item
                        name="durationMinutes"
                        label="Duration"
                        rules={[
                            createSchemaFieldRule(
                                createSessionSchema.pick({ durationMinutes: true })
                            ),
                        ]}
                    >
                        <Select
                            style={{ width: "100%" }}
                            options={[
                                { label: "15 min", value: 15 },
                                { label: "30 min", value: 30 },
                                { label: "45 min", value: 45 },
                                { label: "1 hr", value: 60 },
                                { label: "1.5 hr", value: 90 },
                                { label: "2 hr", value: 120 },
                            ]}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
};
