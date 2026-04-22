import type { AppEnv } from "@api/helpers/types.helpers";
import { OpenAPIHono } from "@hono/zod-openapi";
import { ScheduleHandlers } from "./schedule.handlers";
import { ScheduleRoutes } from "./schedule.routes";

export const scheduleRoutes = new OpenAPIHono<AppEnv>();

scheduleRoutes.openapi(ScheduleRoutes.listSessions, ScheduleHandlers.listSessions);
scheduleRoutes.openapi(ScheduleRoutes.getScheduleMetrics, ScheduleHandlers.getScheduleMetrics);
scheduleRoutes.openapi(ScheduleRoutes.getAnalyticsSessions, ScheduleHandlers.getAnalyticsSessions);
scheduleRoutes.openapi(
    ScheduleRoutes.getAnalyticsAttendance,
    ScheduleHandlers.getAnalyticsAttendance
);
scheduleRoutes.openapi(ScheduleRoutes.createSession, ScheduleHandlers.createSession);
scheduleRoutes.openapi(ScheduleRoutes.updateSession, ScheduleHandlers.updateSession);
scheduleRoutes.openapi(ScheduleRoutes.updateSessionStatus, ScheduleHandlers.updateSessionStatus);
scheduleRoutes.openapi(ScheduleRoutes.updateAttendance, ScheduleHandlers.updateAttendance);
scheduleRoutes.openapi(
    ScheduleRoutes.issueSessionMeetingToken,
    ScheduleHandlers.issueSessionMeetingToken
);
scheduleRoutes.openapi(
    ScheduleRoutes.requestSessionMeetingAdmission,
    ScheduleHandlers.requestSessionMeetingAdmission
);
scheduleRoutes.openapi(
    ScheduleRoutes.getSessionMeetingAdmissionStatus,
    ScheduleHandlers.getSessionMeetingAdmissionStatus
);
scheduleRoutes.openapi(
    ScheduleRoutes.listSessionMeetingPendingAdmissions,
    ScheduleHandlers.listSessionMeetingPendingAdmissions
);
scheduleRoutes.openapi(
    ScheduleRoutes.approveSessionMeetingAdmission,
    ScheduleHandlers.approveSessionMeetingAdmission
);
scheduleRoutes.openapi(
    ScheduleRoutes.denySessionMeetingAdmission,
    ScheduleHandlers.denySessionMeetingAdmission
);
scheduleRoutes.openapi(
    ScheduleRoutes.listSessionMeetingParticipants,
    ScheduleHandlers.listSessionMeetingParticipants
);
scheduleRoutes.openapi(
    ScheduleRoutes.getSessionMeetingMuteStatus,
    ScheduleHandlers.getSessionMeetingMuteStatus
);
scheduleRoutes.openapi(
    ScheduleRoutes.muteSessionMeetingParticipant,
    ScheduleHandlers.muteSessionMeetingParticipant
);
scheduleRoutes.openapi(
    ScheduleRoutes.unmuteSessionMeetingParticipant,
    ScheduleHandlers.unmuteSessionMeetingParticipant
);
scheduleRoutes.openapi(
    ScheduleRoutes.removeSessionMeetingParticipant,
    ScheduleHandlers.removeSessionMeetingParticipant
);
scheduleRoutes.openapi(
    ScheduleRoutes.getSessionMeetingRoomStatus,
    ScheduleHandlers.getSessionMeetingRoomStatus
);
scheduleRoutes.openapi(
    ScheduleRoutes.lockSessionMeetingRoom,
    ScheduleHandlers.lockSessionMeetingRoom
);
scheduleRoutes.openapi(
    ScheduleRoutes.unlockSessionMeetingRoom,
    ScheduleHandlers.unlockSessionMeetingRoom
);
scheduleRoutes.openapi(
    ScheduleRoutes.requestSessionMeetingUnmute,
    ScheduleHandlers.requestSessionMeetingUnmute
);
scheduleRoutes.openapi(
    ScheduleRoutes.getSessionMeetingUnmuteRequestStatus,
    ScheduleHandlers.getSessionMeetingUnmuteRequestStatus
);
scheduleRoutes.openapi(
    ScheduleRoutes.listSessionMeetingUnmuteRequests,
    ScheduleHandlers.listSessionMeetingUnmuteRequests
);
scheduleRoutes.openapi(
    ScheduleRoutes.approveSessionMeetingUnmuteRequest,
    ScheduleHandlers.approveSessionMeetingUnmuteRequest
);
scheduleRoutes.openapi(
    ScheduleRoutes.denySessionMeetingUnmuteRequest,
    ScheduleHandlers.denySessionMeetingUnmuteRequest
);
scheduleRoutes.openapi(ScheduleRoutes.deleteSession, ScheduleHandlers.deleteSession);
