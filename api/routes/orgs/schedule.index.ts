import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "@api/helpers/types.helpers";
import { ScheduleRoutes } from "./schedule.routes";
import { ScheduleHandlers } from "./schedule.handlers";

export const scheduleRoutes = new OpenAPIHono<AppEnv>();

scheduleRoutes.openapi(ScheduleRoutes.listSessions, ScheduleHandlers.listSessions);
scheduleRoutes.openapi(ScheduleRoutes.getScheduleMetrics, ScheduleHandlers.getScheduleMetrics);
scheduleRoutes.openapi(ScheduleRoutes.getAnalyticsSessions, ScheduleHandlers.getAnalyticsSessions);
scheduleRoutes.openapi(ScheduleRoutes.getAnalyticsAttendance, ScheduleHandlers.getAnalyticsAttendance);
scheduleRoutes.openapi(ScheduleRoutes.createSession, ScheduleHandlers.createSession);
scheduleRoutes.openapi(ScheduleRoutes.updateSession, ScheduleHandlers.updateSession);
scheduleRoutes.openapi(ScheduleRoutes.updateSessionStatus, ScheduleHandlers.updateSessionStatus);
scheduleRoutes.openapi(ScheduleRoutes.updateAttendance, ScheduleHandlers.updateAttendance);
scheduleRoutes.openapi(ScheduleRoutes.deleteSession, ScheduleHandlers.deleteSession);
