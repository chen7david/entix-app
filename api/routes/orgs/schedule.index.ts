import { OpenAPIHono } from "@hono/zod-openapi";
import { AppEnv } from "@api/helpers/types.helpers";
import { ScheduleRoutes } from "./schedule.routes";
import { ScheduleHandlers } from "./schedule.handlers";

export const scheduleRoutes = new OpenAPIHono<AppEnv>();

scheduleRoutes.openapi(ScheduleRoutes.listSessions, ScheduleHandlers.listSessions);
scheduleRoutes.openapi(ScheduleRoutes.createSession, ScheduleHandlers.createSession);
scheduleRoutes.openapi(ScheduleRoutes.updateSession, ScheduleHandlers.updateSession);
scheduleRoutes.openapi(ScheduleRoutes.updateParticipantAttendance, ScheduleHandlers.updateParticipantAttendance);
scheduleRoutes.openapi(ScheduleRoutes.deleteSession, ScheduleHandlers.deleteSession);
