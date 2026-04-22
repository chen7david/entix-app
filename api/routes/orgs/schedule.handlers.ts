import { getRealtimeKitService, getSessionScheduleService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { ScheduleRoutes } from "./schedule.routes";

export class ScheduleHandlers {
    static listSessions: AppHandler<typeof ScheduleRoutes.listSessions> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const queryParams = ctx.req.valid("query");
        const { limit, direction, search, cursor, ...filters } = queryParams;
        const { startDate, endDate } = filters as any;

        const service = getSessionScheduleService(ctx);
        const paginatedResult = await service.findSessionsByOrganization(
            organizationId,
            startDate,
            endDate,
            limit,
            cursor,
            direction,
            search
        );

        const normalizedItems = paginatedResult.items.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime).getTime(),
        }));

        return ctx.json({ ...paginatedResult, items: normalizedItems } as any, HttpStatusCodes.OK);
    };

    static createSession: AppHandler<typeof ScheduleRoutes.createSession> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const service = getSessionScheduleService(ctx);

        const sessions = await service.createSession(organizationId, input);
        const normalized = sessions.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime).getTime(),
        }));

        return ctx.json(normalized as any, HttpStatusCodes.CREATED);
    };

    static getScheduleMetrics: AppHandler<typeof ScheduleRoutes.getScheduleMetrics> = async (
        ctx
    ) => {
        const organizationId = ctx.req.valid("param").organizationId;
        const { startDate, endDate } = ctx.req.valid("query");

        const service = getSessionScheduleService(ctx);
        const result = await service.getScheduleMetrics(organizationId, startDate, endDate);

        return ctx.json(result, HttpStatusCodes.OK);
    };

    static getAnalyticsSessions: AppHandler<typeof ScheduleRoutes.getAnalyticsSessions> = async (
        ctx
    ) => {
        const organizationId = ctx.req.valid("param").organizationId;
        const { startDate, endDate, tzOffset } = ctx.req.valid("query");

        const service = getSessionScheduleService(ctx);
        const result = await service.getAnalyticsSessions(
            organizationId,
            startDate,
            endDate,
            tzOffset
        );

        return ctx.json(result, HttpStatusCodes.OK);
    };

    static getAnalyticsAttendance: AppHandler<typeof ScheduleRoutes.getAnalyticsAttendance> =
        async (ctx) => {
            const organizationId = ctx.req.valid("param").organizationId;
            const { startDate, endDate, tzOffset } = ctx.req.valid("query");

            const service = getSessionScheduleService(ctx);
            const result = await service.getAnalyticsAttendance(
                organizationId,
                startDate,
                endDate,
                tzOffset
            );

            return ctx.json(result, HttpStatusCodes.OK);
        };

    static updateSession: AppHandler<typeof ScheduleRoutes.updateSession> = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const service = getSessionScheduleService(ctx);

        const result = await service.updateSession(organizationId, sessionId, input);
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static updateSessionStatus: AppHandler<typeof ScheduleRoutes.updateSessionStatus> = async (
        ctx
    ) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const { status } = ctx.req.valid("json");
        const service = getSessionScheduleService(ctx);

        await service.updateSessionStatus(organizationId, sessionId, status);
        return ctx.json({ success: true }, HttpStatusCodes.OK);
    };

    static updateAttendance: AppHandler<typeof ScheduleRoutes.updateAttendance> = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const service = getSessionScheduleService(ctx);

        const result = await service.updateAttendance(organizationId, sessionId, input.attendances);
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static issueSessionMeetingToken: AppHandler<typeof ScheduleRoutes.issueSessionMeetingToken> =
        async (ctx) => {
            const { organizationId, sessionId } = ctx.req.valid("param");
            const userId = ctx.get("userId");
            const result = await getRealtimeKitService(ctx).issueSessionMeetingToken(
                organizationId,
                sessionId,
                userId
            );
            return ctx.json(result, HttpStatusCodes.OK);
        };

    static requestSessionMeetingAdmission: AppHandler<
        typeof ScheduleRoutes.requestSessionMeetingAdmission
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).requestSessionMeetingAdmission(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static getSessionMeetingAdmissionStatus: AppHandler<
        typeof ScheduleRoutes.getSessionMeetingAdmissionStatus
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).getSessionMeetingAdmissionStatus(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static listSessionMeetingPendingAdmissions: AppHandler<
        typeof ScheduleRoutes.listSessionMeetingPendingAdmissions
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).listSessionMeetingPendingAdmissions(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static approveSessionMeetingAdmission: AppHandler<
        typeof ScheduleRoutes.approveSessionMeetingAdmission
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).decideSessionMeetingAdmission(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            "approved"
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static denySessionMeetingAdmission: AppHandler<
        typeof ScheduleRoutes.denySessionMeetingAdmission
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).decideSessionMeetingAdmission(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            "denied"
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static listSessionMeetingParticipants: AppHandler<
        typeof ScheduleRoutes.listSessionMeetingParticipants
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).listSessionMeetingParticipants(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static getSessionMeetingMuteStatus: AppHandler<
        typeof ScheduleRoutes.getSessionMeetingMuteStatus
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).getSessionMeetingParticipantMuteStatus(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static getSessionMeetingVideoStatus: AppHandler<
        typeof ScheduleRoutes.getSessionMeetingVideoStatus
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).getSessionMeetingParticipantVideoStatus(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static muteSessionMeetingParticipant: AppHandler<
        typeof ScheduleRoutes.muteSessionMeetingParticipant
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).setSessionMeetingParticipantMute(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            true
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static unmuteSessionMeetingParticipant: AppHandler<
        typeof ScheduleRoutes.unmuteSessionMeetingParticipant
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).setSessionMeetingParticipantMute(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            false
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static removeSessionMeetingParticipant: AppHandler<
        typeof ScheduleRoutes.removeSessionMeetingParticipant
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).removeSessionMeetingParticipant(
            organizationId,
            sessionId,
            userId,
            targetUserId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static stopSessionMeetingParticipantVideo: AppHandler<
        typeof ScheduleRoutes.stopSessionMeetingParticipantVideo
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).setSessionMeetingParticipantVideo(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            true
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static allowSessionMeetingParticipantVideo: AppHandler<
        typeof ScheduleRoutes.allowSessionMeetingParticipantVideo
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).setSessionMeetingParticipantVideo(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            false
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static getSessionMeetingRoomStatus: AppHandler<
        typeof ScheduleRoutes.getSessionMeetingRoomStatus
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).getSessionMeetingRoomStatus(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static lockSessionMeetingRoom: AppHandler<typeof ScheduleRoutes.lockSessionMeetingRoom> =
        async (ctx) => {
            const { organizationId, sessionId } = ctx.req.valid("param");
            const userId = ctx.get("userId");
            const result = await getRealtimeKitService(ctx).setSessionMeetingRoomLock(
                organizationId,
                sessionId,
                userId,
                true
            );
            return ctx.json(result, HttpStatusCodes.OK);
        };

    static unlockSessionMeetingRoom: AppHandler<typeof ScheduleRoutes.unlockSessionMeetingRoom> =
        async (ctx) => {
            const { organizationId, sessionId } = ctx.req.valid("param");
            const userId = ctx.get("userId");
            const result = await getRealtimeKitService(ctx).setSessionMeetingRoomLock(
                organizationId,
                sessionId,
                userId,
                false
            );
            return ctx.json(result, HttpStatusCodes.OK);
        };

    static requestSessionMeetingUnmute: AppHandler<
        typeof ScheduleRoutes.requestSessionMeetingUnmute
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).requestSessionMeetingUnmute(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static getSessionMeetingUnmuteRequestStatus: AppHandler<
        typeof ScheduleRoutes.getSessionMeetingUnmuteRequestStatus
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).getSessionMeetingUnmuteRequestStatus(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static listSessionMeetingUnmuteRequests: AppHandler<
        typeof ScheduleRoutes.listSessionMeetingUnmuteRequests
    > = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).listSessionMeetingUnmuteRequests(
            organizationId,
            sessionId,
            userId
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static approveSessionMeetingUnmuteRequest: AppHandler<
        typeof ScheduleRoutes.approveSessionMeetingUnmuteRequest
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).decideSessionMeetingUnmuteRequest(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            "approved"
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static denySessionMeetingUnmuteRequest: AppHandler<
        typeof ScheduleRoutes.denySessionMeetingUnmuteRequest
    > = async (ctx) => {
        const { organizationId, sessionId, targetUserId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const result = await getRealtimeKitService(ctx).decideSessionMeetingUnmuteRequest(
            organizationId,
            sessionId,
            userId,
            targetUserId,
            "denied"
        );
        return ctx.json(result, HttpStatusCodes.OK);
    };

    static deleteSession: AppHandler<typeof ScheduleRoutes.deleteSession> = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const service = getSessionScheduleService(ctx);

        const result = await service.deleteSession(organizationId, sessionId, input.deleteForward);
        return ctx.json(result, HttpStatusCodes.OK);
    };
}
