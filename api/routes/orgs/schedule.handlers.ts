import { AppHandler } from "@api/helpers/types.helpers";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { ScheduleRoutes } from "./schedule.routes";
import { getSessionScheduleService } from "@api/factories/service.factory";
import { getSessionScheduleRepository } from "@api/factories/repository.factory";

export class ScheduleHandlers {
    static listSessions: AppHandler<typeof ScheduleRoutes.listSessions> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { startDate, endDate } = ctx.req.valid("query");
        // We can just grab the Repository directly if listSessions is mapped there
        const repo = getSessionScheduleRepository(ctx);
        const sessions = await repo.getSessionsForOrg(organizationId, startDate, endDate);
        
        // Zod output parsing workaround: SQLite Date objects back to numbers
        const normalized = sessions.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime).getTime(),
        }));
        
        return ctx.json(normalized, HttpStatusCodes.OK);
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

        return ctx.json(normalized, HttpStatusCodes.CREATED);
    };

    static updateSession: AppHandler<typeof ScheduleRoutes.updateSession> = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const input = ctx.req.valid("json");
        const service = getSessionScheduleService(ctx);
        
        const result = await service.updateSession(organizationId, sessionId, input);
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
