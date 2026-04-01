import { getAvatarUrl } from "@shared";
import { Alert, Avatar, Button, Input, List, Select, Switch, theme } from "antd";
import type React from "react";
import type { AttendanceLog } from "./types";

type SessionAttendanceManagerProps = {
    session: any;
    attendanceDict: Record<string, AttendanceLog>;
    setAttendanceDict: (dict: Record<string, AttendanceLog>) => void;
    onSaveAttendance: () => Promise<void>;
    isSubmitting: boolean;
};

export const SessionAttendanceManager: React.FC<SessionAttendanceManagerProps> = ({
    session,
    attendanceDict,
    setAttendanceDict,
    onSaveAttendance,
    isSubmitting,
}) => {
    const { token } = theme.useToken();

    if (!session) return null;

    return (
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
                            <div className="flex justify-between items-center mb-3">
                                <Space size={12}>
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
                                </Space>
                                <Switch
                                    checkedChildren="Absent"
                                    unCheckedChildren="Present"
                                    checked={log.absent}
                                    style={{
                                        backgroundColor: log.absent
                                            ? token.colorError
                                            : token.colorSuccess,
                                    }}
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
                                <div className="flex flex-col gap-2 mb-3">
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
            <div className="mt-6 text-right">
                <Button type="primary" onClick={onSaveAttendance} loading={isSubmitting}>
                    Save Attendance
                </Button>
            </div>
        </div>
    );
};

import { Space } from "antd";
