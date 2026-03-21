import { Drawer, Form, Input, DatePicker, TimePicker, Select, Button, Switch, InputNumber, Modal, Space } from "antd";
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
};

type Props = {
    open: boolean;
    onClose: () => void;
    session: any | null;
    onSave: (payload: SessionSubmitPayload) => Promise<void>;
    onDelete?: (sessionId: string, deleteForward: boolean) => Promise<void>;
};

export const SessionDetailsDrawer = ({ open, onClose, session, onSave, onDelete }: Props) => {
    const [form] = Form.useForm();
    const { members, loadingMembers } = useMembers();
    const [isRecurring, setIsRecurring] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && session) {
            form.setFieldsValue({
                title: session.title,
                description: session.description,
                date: dayjs(session.startTime),
                time: dayjs(session.startTime),
                durationMinutes: session.durationMinutes,
                memberIds: session.participants?.map((p: any) => p.memberId) || [],
            });
            setIsRecurring(false);
        } else if (open) {
            form.resetFields();
            setIsRecurring(false);
            form.setFieldsValue({ durationMinutes: 60 });
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

    return (
        <Drawer title={session ? "Edit Session" : "Schedule New Session"} width={500} onClose={onClose} open={open} destroyOnClose>
            <Form form={form} layout="vertical" onFinish={handleFinish}>
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
                        <Button type="primary" htmlType="submit" loading={isSubmitting}>
                            {session ? "Update Session" : "Schedule"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Drawer>
    );
};
