import { getSessionScheduleService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { ScheduleRoutes } from "./schedule.routes";

export class ScheduleHandlers {
    static getSessionById: AppHandler<typeof ScheduleRoutes.getSessionById> = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const service = getSessionScheduleService(ctx);
        const session = await service.getSessionById(organizationId, sessionId);
        return ctx.json(
            {
                ...session,
                startTime: new Date(session.startTime).getTime(),
            } as any,
            HttpStatusCodes.OK
        );
    };

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

    static deleteSession: AppHandler<typeof ScheduleRoutes.deleteSession> = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const service = getSessionScheduleService(ctx);

        const result = await service.deleteSession(organizationId, sessionId, input.deleteForward);
        return ctx.json(result, HttpStatusCodes.OK);
    };
}
