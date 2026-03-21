import { Drawer, Form, Input, DatePicker, TimePicker, Select, Button, Switch, InputNumber, Modal, Space, Tabs, List, Checkbox, Alert } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useMembers } from "@web/src/hooks/auth/useMembers";

export type SessionSubmitPayload = {
    title: string;
    description?: string;
    startTime: number;
    durationMinutes: number;
    memberIds: string[];
    updateForward?: boolean;
    recurrence?: { frequency: "weekly", count: number };
    status?: "scheduled" | "completed" | "cancelled";
};

type Props = {
    open: boolean;
    onClose: () => void;
    session: any | null;
    onSave: (payload: SessionSubmitPayload) => Promise<void>;
    onSaveAttendance?: (sessionId: string, participants: any[]) => Promise<void>;
    onDelete?: (sessionId: string, deleteForward: boolean) => Promise<void>;
};

export const SessionDetailsDrawer = ({ open, onClose, session, onSave, onSaveAttendance, onDelete }: Props) => {
    const [form] = Form.useForm();
    const { members, loadingMembers } = useMembers();
    const [isRecurring, setIsRecurring] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attendanceDict, setAttendanceDict] = useState<Record<string, { absent: boolean; absenceReason: string; notes: string }>>({});

    useEffect(() => {
        if (open && session) {
            form.setFieldsValue({
                title: session.title,
                description: session.description,
                date: dayjs(session.startTime),
                time: dayjs(session.startTime),
                durationMinutes: session.durationMinutes,
                status: session.status || "scheduled",
                memberIds: session.participants?.map((p: any) => p.memberId) || [],
            });
            setIsRecurring(false);
            
            // Hydrate attendance dictionary map
            const att: Record<string, any> = {};
            if (session.participants) {
                session.participants.forEach((p: any) => {
                    att[p.memberId] = {
                        absent: p.absent ?? false,
                        absenceReason: p.absenceReason || "",
                        notes: p.notes || ""
                    }
                });
            }
            setAttendanceDict(att);

        } else if (open) {
            form.resetFields();
            setIsRecurring(false);
            setAttendanceDict({});
            form.setFieldsValue({ durationMinutes: 60, status: "scheduled" });
        }
    }, [open, session, form]);

    const submitForm = async (values: any, updateForward: boolean = false) => {
        try {
            setIsSubmitting(true);
            const startDateTime = values.date.hour(values.time.hour()).minute(values.time.minute()).second(0).millisecond(0).valueOf();

            const payload: SessionSubmitPayload = {
                title: values.title,
                description: values.description,
                startTime: startDateTime,
                durationMinutes: values.durationMinutes,
                memberIds: values.memberIds || [],
                updateForward,
                status: values.status,
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
            const partsMapping = Object.entries(attendanceDict).map(([memberId, data]) => ({
                memberId,
                ...data
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
        if (session && session.seriesId) {
            Modal.confirm({
                title: 'Update Recurring Session',
                content: 'Do you want to update just this occurrence, or this and all following sessions in the series? Updating all succeeding loops will permanently overwrite their dates mapped locally from this new anchor.',
                okText: 'This and following',
                cancelText: 'Just this session',
                onOk: () => submitForm(values, true),
                onCancel: () => submitForm(values, false),
            });
        } else {
            submitForm(values, false);
        }
    };

    const handleDelete = () => {
        if (!session || !onDelete) return;

        if (session.seriesId) {
            Modal.confirm({
                title: 'Delete Recurring Session',
                content: 'Do you want to delete just this occurrence, or this and all following sessions in the series?',
                okText: 'This and following',
                cancelText: 'Just this session',
                okType: 'danger',
                onOk: () => onDelete(session.id, true),
                onCancel: () => onDelete(session.id, false),
            });
        } else {
            Modal.confirm({
                title: 'Delete Session',
                content: 'Are you sure you want to delete this session? This action cannot be undone.',
                okText: 'Delete',
                cancelText: 'Cancel',
                okType: 'danger',
                onOk: () => onDelete(session.id, false),
            });
        }
    };

    const detailsForm = (
            <Form form={form} layout="vertical" onFinish={handleFinish} id="session-form">
                {session && (
                    <Form.Item name="status" label="Session Status">
                        <Select options={[
                            { label: "Scheduled", value: "scheduled" },
                            { label: "Completed", value: "completed" },
                            { label: "Cancelled", value: "cancelled" }
                        ]} />
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
                <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please input title" }]}>
                    <Input placeholder="Session Title" />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} placeholder="Session Context" />
                </Form.Item>

                <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item name="date" label="Date" rules={[{ required: true, message: "Required" }]}>
                        <DatePicker />
                    </Form.Item>
                    <Form.Item name="time" label="Time" rules={[{ required: true, message: "Required" }]}>
                        <TimePicker minuteStep={15} format="HH:mm" />
                    </Form.Item>
                    <Form.Item name="durationMinutes" label="Duration" rules={[{ required: true, message: "Required" }]}>
                        <Select options={[
                            { label: "15 min", value: 15 },
                            { label: "30 min", value: 30 },
                            { label: "45 min", value: 45 },
                            { label: "1 hr", value: 60 },
                            { label: "1.5 hr", value: 90 },
                            { label: "2 hr", value: 120 },
                        ]} style={{ width: 100 }} />
                    </Form.Item>
                </Space>

                <Form.Item name="memberIds" label="Assign Members">
                    <Select
                        mode="multiple"
                        placeholder="Select teachers or participants"
                        loading={loadingMembers}
                        options={(members || []).map((m: any) => ({
                            label: m.user?.name || m.user?.email,
                            value: m.id
                        }))}
                        showSearch
                        optionFilterProp="label"
                    />
                </Form.Item>

                {!session && (
                    <Form.Item label="Recurring Weekly">
                        <Switch checked={isRecurring} onChange={setIsRecurring} />
                    </Form.Item>
                )}

                {!session && isRecurring && (
                    <Form.Item name="recurrenceCount" label="Total Occurrences (Weeks)" rules={[{ required: true, message: "Please enter count (between 2 and 52)" }]}>
                        <InputNumber min={2} max={52} />
                    </Form.Item>
                )}

                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                        {session && onDelete && (
                            <Button danger onClick={handleDelete} loading={isSubmitting}>
                                Delete Session
                            </Button>
                        )}
                    </div>
                    <Space>
                        <Button type="primary" htmlType="submit" form="session-form" loading={isSubmitting}>
                            {session ? "Update Session" : "Schedule"}
                        </Button>
                    </Space>
                </div>
            </Form>
    );

    const attendanceTab = session ? (
        <div style={{ marginTop: 16 }}>
            <Alert type="info" message="Log student presence and private behavior notes below before marking the session completed." showIcon style={{ marginBottom: 16 }}/>
            <List
                dataSource={session.participants || []}
                renderItem={(item: any) => {
                    const memberName = item.member?.user?.name || item.member?.user?.email || item.memberId;
                    const log = attendanceDict[item.memberId] || { absent: false, absenceReason: "", notes: "" };
                    return (
                        <List.Item style={{ display: 'block' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <strong>{memberName}</strong>
                                <Checkbox 
                                    checked={log.absent} 
                                    onChange={(e) => setAttendanceDict({ ...attendanceDict, [item.memberId]: { ...log, absent: e.target.checked } })}
                                >
                                    Absent
                                </Checkbox>
                            </div>
                            {log.absent && (
                                <Input 
                                    placeholder="Reason for absence (optional)" 
                                    value={log.absenceReason} 
                                    onChange={(e) => setAttendanceDict({ ...attendanceDict, [item.memberId]: { ...log, absenceReason: e.target.value } })}
                                    style={{ marginBottom: 8 }}
                                />
                            )}
                            <Input.TextArea 
                                placeholder="Student performance notes..." 
                                rows={2} 
                                value={log.notes}
                                onChange={(e) => setAttendanceDict({ ...attendanceDict, [item.memberId]: { ...log, notes: e.target.value } })}
                            />
                        </List.Item>
                    );
                }}
            />
            {(!session.participants || session.participants.length === 0) && (
                <Alert type="warning" message="No students assigned to record attendance." />
            )}
            <div style={{ marginTop: 24, textAlign: 'right' }}>
               <Button type="primary" onClick={handleSaveAttendance} loading={isSubmitting}>Save Attendance</Button>
            </div>
        </div>
    ) : null;

    return (
        <Drawer title={session ? "Edit Session" : "Schedule New Session"} width={500} onClose={onClose} open={open} destroyOnClose>
            {session ? (
                <Tabs defaultActiveKey="1" items={[
                    { key: "1", label: "Details", children: detailsForm },
                    { key: "2", label: "Attendance", children: attendanceTab }
                ]} />
            ) : (
                detailsForm
            )}
        </Drawer>
    );
};
