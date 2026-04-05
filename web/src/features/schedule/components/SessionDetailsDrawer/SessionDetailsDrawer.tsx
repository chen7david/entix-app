import { useDebouncedValue } from "@tanstack/react-pacer";
import { useMembers } from "@web/src/features/organization";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { App, Drawer, Form, Modal, Tabs } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { MemberSelector } from "./MemberSelector";
import { SessionAttendanceManager } from "./SessionAttendanceManager";
import { SessionDangerZone } from "./SessionDangerZone";
import { SessionGeneralForm } from "./SessionGeneralForm";
import type { AttendanceLog, SessionDetailsDrawerProps, SessionSubmitPayload } from "./types";

export const SessionDetailsDrawer = ({
    open,
    onClose,
    session,
    onSave,
    onUpdateStatus,
    onSaveAttendance,
    onDelete,
}: SessionDetailsDrawerProps) => {
    const { notification } = App.useApp();
    const [form] = Form.useForm();
    const [memberSearch, setMemberSearch] = useState("");
    const [debouncedMemberSearch] = useDebouncedValue(memberSearch, {
        wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE,
    });

    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
    const { members, loadingMembers, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useMembers(debouncedMemberSearch);

    const [memberCache, setMemberCache] = useState<
        Record<string, { name: string; image?: string }>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attendanceDict, setAttendanceDict] = useState<Record<string, AttendanceLog>>({});

    // Cache sync logic for member metadata persistence during search
    useEffect(() => {
        if (members?.length) {
            setMemberCache((prev) => {
                const next = { ...prev };
                members.forEach((m: any) => {
                    if (m.userId) {
                        next[m.userId] = {
                            name: m.name || m.email,
                            image: m.avatarUrl,
                        };
                    }
                });
                return next;
            });
        }
    }, [members]);

    // Pre-hydrate cache from existing session
    useEffect(() => {
        if (open && session?.attendances) {
            setMemberCache((prev) => {
                const next = { ...prev };
                session.attendances.forEach((p: any) => {
                    if (p.userId) {
                        next[p.userId] = {
                            name: p.name || p.email || p.userId,
                            image: p.avatarUrl,
                        };
                    }
                });
                return next;
            });
        }
    }, [open, session]);

    // Form hydration
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

            const att: Record<string, AttendanceLog> = {};
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
            setAttendanceDict({});
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

            await onSave(payload);
            notification.success({ message: "Session saved successfully" });
            onClose();
        } catch (e: any) {
            notification.error({
                message: "Save Failed",
                description: e.message || "Failed to save session details.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinish = (values: any) => {
        if (session?.seriesId) {
            Modal.confirm({
                title: "Update Recurring Session",
                content:
                    "Do you want to update just this occurrence, or this and all following sessions in the series?",
                closable: true,
                okText: "Update following",
                cancelText: "Just this",
                onOk: () => submitForm(values, true),
                onCancel: () => submitForm(values, false),
            });
        } else {
            submitForm(values, false);
        }
    };

    const handleGenerateTitle = async () => {
        const selectedIds = form.getFieldValue("userIds") || [];
        if (selectedIds.length === 0) {
            notification.warning({ message: "Select members first to generate a title" });
            return;
        }

        setIsGeneratingTitle(true);
        await new Promise((res) => setTimeout(res, 600));

        const names = selectedIds.map((id: string) => memberCache[id]?.name).filter(Boolean);
        if (names.length === 0) {
            setIsGeneratingTitle(false);
            return;
        }

        let generatedTitle = "";
        if (names.length === 1) generatedTitle = names[0];
        else if (names.length === 2) generatedTitle = `${names[0]} & ${names[1]}`;
        else {
            const last = names.pop();
            generatedTitle = `${names.join(", ")} & ${last}`;
        }

        form.setFieldsValue({ title: generatedTitle });
        setIsGeneratingTitle(false);
    };

    const items = [
        {
            key: "details",
            label: "Details",
            children: (
                <div style={{ marginTop: 16 }}>
                    <SessionGeneralForm
                        form={form}
                        session={session}
                        onUpdateStatus={onUpdateStatus}
                        isGeneratingTitle={isGeneratingTitle}
                        onGenerateTitle={handleGenerateTitle}
                    />
                    <MemberSelector
                        loading={loadingMembers}
                        members={members}
                        memberSearch={memberSearch}
                        onSearch={setMemberSearch}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        fetchNextPage={fetchNextPage}
                        memberCache={memberCache}
                    />
                </div>
            ),
        },
        ...(session
            ? [
                  {
                      key: "attendance",
                      label: "Attendance",
                      children: (
                          <SessionAttendanceManager
                              session={session}
                              attendanceDict={attendanceDict}
                              setAttendanceDict={setAttendanceDict}
                              onSaveAttendance={async () => {
                                  if (!onSaveAttendance) return;
                                  setIsSubmitting(true);
                                  await onSaveAttendance(
                                      session.id,
                                      Object.entries(attendanceDict).map(([userId, data]) => ({
                                          userId,
                                          ...data,
                                      }))
                                  );
                                  setIsSubmitting(false);
                              }}
                              isSubmitting={isSubmitting}
                          />
                      ),
                  },
              ]
            : []),
        ...(session && onDelete
            ? [
                  {
                      key: "danger",
                      label: "Danger Zone",
                      children: (
                          <SessionDangerZone
                              session={session}
                              onDelete={() => onDelete(session.id, false)}
                          />
                      ),
                  },
              ]
            : []),
    ];

    return (
        <Drawer
            title={session ? "Edit Session" : "Schedule New Session"}
            width={520}
            open={open}
            onClose={onClose}
            destroyOnClose
            styles={{ body: { paddingBottom: 80 } }}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} id="session-form">
                <Tabs items={items} />
            </Form>
        </Drawer>
    );
};
