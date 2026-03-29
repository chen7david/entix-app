import { getAvatarUrl } from "@shared/utils/image-url";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useMembers } from "@web/src/features/organization";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import {
    Alert,
    App,
    Avatar,
    Button,
    DatePicker,
    Drawer,
    Form,
    Input,
    InputNumber,
    List,
    Modal,
    Select,
    Space,
    Switch,
    Tabs,
    Tag,
    TimePicker,
    Tooltip,
    Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

export type SessionSubmitPayload = {
    title: string;
    description?: string;
    startTime: number;
    durationMinutes: number;
    userIds: string[];
    updateForward?: boolean;
    recurrence?: { frequency: "weekly"; count: number };
    status?: "scheduled" | "completed" | "cancelled";
};

type Props = {
    open: boolean;
    onClose: () => void;
    session: any | null;
    onSave: (payload: SessionSubmitPayload) => Promise<void>;
    onUpdateStatus?: (
        sessionId: string,
        status: "scheduled" | "completed" | "cancelled"
    ) => Promise<void>;
    onSaveAttendance?: (sessionId: string, attendances: any[]) => Promise<void>;
    onDelete?: (sessionId: string, deleteForward: boolean) => Promise<void>;
};

const { Text } = Typography;

export const SessionDetailsDrawer = ({
    open,
    onClose,
    session,
    onSave,
    onUpdateStatus,
    onSaveAttendance,
    onDelete,
}: Props) => {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [memberSearch, setMemberSearch] = useState("");
    const [debouncedMemberSearch] = useDebouncedValue(memberSearch, {
        wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE,
    });
    const { members, loadingMembers, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useMembers(debouncedMemberSearch);
    const [isRecurring, setIsRecurring] = useState(false);
    const [enableDelete, setEnableDelete] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recurrenceMode, setRecurrenceMode] = useState<"preset" | "custom">("preset");
    const [attendanceDict, setAttendanceDict] = useState<
        Record<
            string,
            { absent: boolean; absenceType?: string; absenceReason: string; notes: string }
        >
    >({});

    useEffect(() => {
        if (open && session) {
            form.setFieldsValue({
                title: session.title,
                description: session.description,
                date: dayjs(session.startTime),
                time: dayjs(session.startTime),
                durationMinutes: session.durationMinutes,
                status: session.status || "scheduled",
                userIds: session.attendances?.map((p: any) => p.userId) || [],
            });
            setIsRecurring(false);
            setEnableDelete(false);

            // Hydrate attendance dictionary map
            const att: Record<string, any> = {};
            if (session.attendances) {
                session.attendances.forEach((p: any) => {
                    const isPreset = ["Sick", "Personal", "Emergency", "Exams", "Holiday"].includes(
                        p.absenceReason
                    );
                    att[p.userId] = {
                        absent: p.absent ?? false,
                        absenceType: p.absenceReason
                            ? isPreset
                                ? p.absenceReason
                                : "Custom"
                            : undefined,
                        absenceReason: p.absenceReason || "",
                        notes: p.notes || "",
                    };
                });
            }
            setAttendanceDict(att);
        } else if (open) {
            form.resetFields();
            setIsRecurring(false);
            setRecurrenceMode("preset");
            setAttendanceDict({});
            setEnableDelete(false);
            form.setFieldsValue({ durationMinutes: 60, status: "scheduled" });
        }
    }, [open, session, form]);

    const submitForm = async (values: any, updateForward: boolean = false) => {
        try {
            setIsSubmitting(true);
            const startDateTime = values.date
                .hour(values.time.hour())
                .minute(values.time.minute())
                .second(0)
                .millisecond(0)
                .valueOf();

            const payload: SessionSubmitPayload = {
                title: values.title,
                description: values.description,
                startTime: startDateTime,
                durationMinutes: values.durationMinutes,
                userIds: values.userIds || [],
                updateForward,
            };

            if (!session && isRecurring) {
                payload.recurrence = { frequency: "weekly", count: values.recurrenceCount };
            }

            await onSave(payload);
            setIsSubmitting(false);
        } catch {
            setIsSubmitting(false);
        }
    };

    const handleSaveAttendance = async () => {
        if (!session || !onSaveAttendance) return;
        setIsSubmitting(true);
        try {
            const partsMapping = Object.entries(attendanceDict).map(([userId, data]) => ({
                userId,
                ...data,
            }));
            if (partsMapping.length > 0) {
                await onSaveAttendance(session.id, partsMapping);
            }
            setIsSubmitting(false);
        } catch {
            setIsSubmitting(false);
        }
    };

    const handleFinish = (values: any) => {
        if (session?.seriesId) {
            const modal = Modal.confirm({
                title: "Update Recurring Session",
                content:
                    "Do you want to update just this occurrence, or this and all following sessions in the series?",
                closable: true,
                footer: () => (
                    <Space style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={() => modal.destroy()}>Cancel</Button>
                        <Button
                            onClick={() => {
                                modal.destroy();
                                submitForm(values, false);
                            }}
                        >
                            Just this session
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                modal.destroy();
                                submitForm(values, true);
                            }}
                        >
                            This and following
                        </Button>
                    </Space>
                ),
            });
        } else {
            submitForm(values, false);
        }
    };

    const handleDelete = () => {
        if (!session || !onDelete) return;

        if (session.seriesId) {
            const modal = Modal.confirm({
                title: "Delete Recurring Session",
                content:
                    "Do you want to delete just this occurrence, or this and all following sessions in the series?",
                closable: true,
                footer: () => (
                    <Space style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={() => modal.destroy()}>Cancel</Button>
                        <Button
                            danger
                            onClick={() => {
                                modal.destroy();
                                onDelete(session.id, false);
                            }}
                        >
                            Just this session
                        </Button>
                        <Button
                            danger
                            type="primary"
                            onClick={() => {
                                modal.destroy();
                                onDelete(session.id, true);
                            }}
                        >
                            This and following
                        </Button>
                    </Space>
                ),
            });
        } else {
            Modal.confirm({
                title: "Delete Session",
                content:
                    "Are you sure you want to delete this session? This action cannot be undone.",
                okText: "Delete",
                cancelText: "Cancel",
                okType: "danger",
                closable: true,
                onOk: () => onDelete(session.id, false),
            });
        }
    };

    const detailsForm = (
        <Form form={form} layout="vertical" onFinish={handleFinish} id="session-form">
            {session && (
                <Form.Item label="Session Status" style={{ marginBottom: 16 }}>
                    <Select
                        value={form.getFieldValue("status") || "scheduled"}
                        onChange={async (val) => {
                            form.setFieldsValue({ status: val });
                            if (onUpdateStatus) {
                                try {
                                    await onUpdateStatus(
                                        session.id,
                                        val as "scheduled" | "completed" | "cancelled"
                                    );
                                    message.success("Status saved successfully");
                                } catch (_e) {
                                    message.error("Failed to update status");
                                }
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
                    message="Marking as completed will trigger student billing for present attendees based on future invoicing logic."
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please input title" }]}
            >
                <Input placeholder="Session Title" />
            </Form.Item>

            <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Session Context" />
            </Form.Item>

            <Space style={{ display: "flex", marginBottom: 8 }} align="baseline">
                <Form.Item
                    name="date"
                    label="Date"
                    rules={[{ required: true, message: "Required" }]}
                >
                    <DatePicker />
                </Form.Item>
                <Form.Item
                    name="time"
                    label="Time"
                    rules={[{ required: true, message: "Required" }]}
                >
                    <TimePicker minuteStep={15} format="HH:mm" />
                </Form.Item>
                <Form.Item
                    name="durationMinutes"
                    label="Duration"
                    rules={[{ required: true, message: "Required" }]}
                >
                    <Select
                        options={[
                            { label: "15 min", value: 15 },
                            { label: "30 min", value: 30 },
                            { label: "45 min", value: 45 },
                            { label: "1 hr", value: 60 },
                            { label: "1.5 hr", value: 90 },
                            { label: "2 hr", value: 120 },
                        ]}
                        style={{ width: 100 }}
                    />
                </Form.Item>
            </Space>

            <Form.Item name="userIds" label="Assign Members">
                <Select
                    mode="multiple"
                    placeholder="Select teachers or participants"
                    loading={loadingMembers || isFetchingNextPage}
                    options={(members || []).map((m: any) => ({
                        label: m.user?.name || m.user?.email,
                        value: m.user?.id,
                        image: m.user?.image, // Include image for the custom renderers
                    }))}
                    showSearch
                    filterOption={false}
                    onSearch={setMemberSearch}
                    onPopupScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                        if (
                            scrollHeight - scrollTop <= clientHeight + 10 &&
                            hasNextPage &&
                            !isFetchingNextPage
                        ) {
                            fetchNextPage();
                        }
                    }}
                    searchValue={memberSearch}
                    onBlur={() => setMemberSearch("")}
                    optionRender={(option) => (
                        <Space>
                            <Avatar
                                size="small"
                                src={
                                    option.data.image
                                        ? getAvatarUrl(option.data.image, "sm")
                                        : undefined
                                }
                            >
                                {!option.data.image &&
                                    option.label?.toString().charAt(0).toUpperCase()}
                            </Avatar>
                            {option.label}
                        </Space>
                    )}
                    tagRender={(props) => {
                        const { label, value, closable, onClose } = props;
                        const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
                            event.preventDefault();
                            event.stopPropagation();
                        };
                        const member = members.find((m: any) => m.userId === value);
                        return (
                            <Tooltip title={label} mouseEnterDelay={0.5}>
                                <Tag
                                    color="blue"
                                    onMouseDown={onPreventMouseDown}
                                    closable={closable}
                                    onClose={onClose}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        margin: "2px 4px 2px 0",
                                        width: 140, // Reduced to ensure exactly 2 fit per line with margins
                                    }}
                                >
                                    <Avatar
                                        size={16}
                                        src={
                                            member?.user?.image
                                                ? getAvatarUrl(member.user.image, "sm")
                                                : undefined
                                        }
                                        style={{ fontSize: 10, flexShrink: 0 }}
                                    >
                                        {!member?.user?.image &&
                                            label?.toString().charAt(0).toUpperCase()}
                                    </Avatar>
                                    <span
                                        style={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {label}
                                    </span>
                                </Tag>
                            </Tooltip>
                        );
                    }}
                />
            </Form.Item>

            {!session && (
                <Form.Item label="Recurring Weekly">
                    <Switch checked={isRecurring} onChange={setIsRecurring} />
                </Form.Item>
            )}

            {!session && isRecurring && recurrenceMode === "preset" && (
                <Form.Item
                    name="recurrenceCount"
                    label="Total Occurrences (Weeks)"
                    rules={[{ required: true, message: "Please select bound count" }]}
                >
                    <Select
                        options={[
                            { label: "5 Weeks", value: 5 },
                            { label: "10 Weeks", value: 10 },
                            { label: "15 Weeks", value: 15 },
                            { label: "20 Weeks", value: 20 },
                            { label: "30 Weeks", value: 30 },
                            { label: "52 Weeks (1 Year)", value: 52 },
                            { label: "Custom...", value: "custom" },
                        ]}
                        onChange={(val) => {
                            if (val === "custom") {
                                setRecurrenceMode("custom");
                                form.setFieldsValue({ recurrenceCount: 8 });
                            }
                        }}
                    />
                </Form.Item>
            )}

            {!session && isRecurring && recurrenceMode === "custom" && (
                <>
                    <Form.Item
                        name="recurrenceCount"
                        label="Total Occurrences (Weeks) [Custom]"
                        rules={[
                            { required: true, message: "Please enter count (between 2 and 100)" },
                        ]}
                    >
                        <InputNumber min={2} max={100} style={{ width: "100%" }} />
                    </Form.Item>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            setRecurrenceMode("preset");
                            form.setFieldsValue({ recurrenceCount: 5 });
                        }}
                        style={{ marginTop: -16, marginBottom: 16, padding: 0 }}
                    >
                        Back to Presets
                    </Button>
                </>
            )}

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Space>
                    <Button
                        type="primary"
                        htmlType="submit"
                        form="session-form"
                        loading={isSubmitting}
                    >
                        {session ? "Update Session" : "Schedule"}
                    </Button>
                </Space>
            </div>
        </Form>
    );

    const attendanceTab = session ? (
        <div style={{ marginTop: 16 }}>
            <Alert
                type="info"
                message="Log student presence and private behavior notes below before marking the session completed."
                showIcon
                style={{ marginBottom: 16 }}
            />
            <List
                dataSource={session.attendances || []}
                renderItem={(item: any) => {
                    const memberName = item.user?.name || item.user?.email || item.userId;
                    const log = attendanceDict[item.userId] || {
                        absent: false,
                        absenceReason: "",
                        notes: "",
                    };
                    return (
                        <List.Item style={{ display: "block" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <Avatar
                                        src={
                                            item.user?.image
                                                ? getAvatarUrl(item.user.image, "sm")
                                                : undefined
                                        }
                                    >
                                        {!item.user?.image &&
                                            typeof memberName === "string" &&
                                            memberName.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <strong style={{ fontSize: 16 }}>{memberName}</strong>
                                </div>
                                <Switch
                                    checkedChildren="Absent"
                                    unCheckedChildren="Present"
                                    checked={log.absent}
                                    style={{ backgroundColor: log.absent ? "#ff4d4f" : "#52c41a" }}
                                    onChange={(checked) => {
                                        const defaultType = log.absenceType || "Sick";
                                        setAttendanceDict({
                                            ...attendanceDict,
                                            [item.userId]: {
                                                ...log,
                                                absent: checked,
                                                absenceType: checked ? defaultType : undefined,
                                                absenceReason: checked
                                                    ? defaultType === "Custom"
                                                        ? ""
                                                        : defaultType
                                                    : "",
                                            },
                                        });
                                    }}
                                />
                            </div>
                            {log.absent && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        marginBottom: 12,
                                    }}
                                >
                                    <Select
                                        placeholder="Reason for absence"
                                        value={log.absenceType || "Sick"}
                                        onChange={(val) =>
                                            setAttendanceDict({
                                                ...attendanceDict,
                                                [item.userId]: {
                                                    ...log,
                                                    absenceType: val,
                                                    absenceReason: val === "Custom" ? "" : val,
                                                },
                                            })
                                        }
                                        options={[
                                            { label: "Sick", value: "Sick" },
                                            { label: "Personal Leave", value: "Personal" },
                                            { label: "Emergency", value: "Emergency" },
                                            { label: "Exams", value: "Exams" },
                                            { label: "Holiday", value: "Holiday" },
                                            { label: "Custom...", value: "Custom" },
                                        ]}
                                    />
                                    {log.absenceType === "Custom" && (
                                        <Input
                                            placeholder="Specify custom reason..."
                                            value={log.absenceReason}
                                            onChange={(e) =>
                                                setAttendanceDict({
                                                    ...attendanceDict,
                                                    [item.userId]: {
                                                        ...log,
                                                        absenceReason: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    )}
                                </div>
                            )}
                            <Input.TextArea
                                placeholder="Student performance notes..."
                                rows={2}
                                value={log.notes}
                                onChange={(e) =>
                                    setAttendanceDict({
                                        ...attendanceDict,
                                        [item.userId]: { ...log, notes: e.target.value },
                                    })
                                }
                            />
                        </List.Item>
                    );
                }}
            />
            {(!session.attendances || session.attendances.length === 0) && (
                <Alert type="warning" message="No students assigned to record attendance." />
            )}
            <div style={{ marginTop: 24, textAlign: "right" }}>
                <Button type="primary" onClick={handleSaveAttendance} loading={isSubmitting}>
                    Save Attendance
                </Button>
            </div>
        </div>
    ) : null;

    const dangerZoneTab =
        session && onDelete ? (
            <div style={{ marginTop: 16 }}>
                <div
                    style={{
                        marginBottom: 24,
                        padding: 16,
                        border: "1px solid #ffccc7",
                        backgroundColor: "#fff2f0",
                        borderRadius: 8,
                    }}
                >
                    <Text strong style={{ fontSize: 16, display: "block", color: "#cf1322" }}>
                        Danger Zone
                    </Text>

                    <Space align="center" style={{ marginTop: 16, marginBottom: 8 }}>
                        <Switch checked={enableDelete} onChange={setEnableDelete} size="small" />
                        <Tooltip title="Only use deletion to bulk-purge accidentally created repetitive sessions.">
                            <Text strong>Enable Deletion</Text>
                        </Tooltip>
                    </Space>

                    <Text
                        type="secondary"
                        style={{ display: "block", marginBottom: 16, fontSize: 13 }}
                    >
                        To retain historical metrics reliably, actively assign the session status as
                        Cancelled utilizing the top selector correctly.
                    </Text>

                    {enableDelete && (
                        <Button danger onClick={handleDelete} loading={isSubmitting}>
                            Delete Session
                        </Button>
                    )}
                </div>
            </div>
        ) : null;

    return (
        <Drawer
            title={session ? "Edit Session" : "Schedule New Session"}
            width={400}
            onClose={onClose}
            open={open}
            destroyOnClose
        >
            {session ? (
                <Tabs
                    defaultActiveKey="1"
                    items={[
                        { key: "1", label: "Details", children: detailsForm },
                        { key: "2", label: "Attendance", children: attendanceTab },
                        ...(dangerZoneTab
                            ? [
                                  {
                                      key: "3",
                                      label: <span style={{ color: "#ff4d4f" }}>Danger Zone</span>,
                                      children: dangerZoneTab,
                                  },
                              ]
                            : []),
                    ]}
                />
            ) : (
                detailsForm
            )}
        </Drawer>
    );
};
