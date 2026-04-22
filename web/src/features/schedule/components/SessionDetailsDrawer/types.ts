export type SessionSubmitPayload = {
    title: string;
    description?: string;
    teacherUserId: string;
    startTime: number;
    durationMinutes: number;
    userIds: string[];
    updateForward?: boolean;
    recurrence?: { frequency: "daily" | "weekly" | "biweekly" | "monthly"; count: number };
    status?: "scheduled" | "completed" | "cancelled";
};

export type AttendanceLog = {
    absent: boolean;
    absenceType?: string;
    absenceReason: string;
    notes: string;
};

export type SessionDetailsDrawerProps = {
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
    /** Opens Realtime Kit video for the current session (teacher + join window on the API). */
    onJoinVideo?: () => void | Promise<void>;
    joinMeetingPending?: boolean;
};
