import { BadRequestError, NotFoundError } from "@api/errors/app.error";
import {
    getScheduledSessionsRepository,
    getSessionAttendancesRepository,
} from "@api/factories/repository.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { EnrollmentRoutes } from "./enrollment.routes";

export class EnrollmentHandlers {
    static createEnrollment: AppHandler<typeof EnrollmentRoutes.createEnrollment> = async (ctx) => {
        const { organizationId, sessionId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const userId = payload?.userId ?? ctx.get("userId");

        if (!userId) {
            throw new BadRequestError("Missing userId for enrollment");
        }

        const sessionsRepo = getScheduledSessionsRepository(ctx);
        const attendancesRepo = getSessionAttendancesRepository(ctx);
        const session = await sessionsRepo.findByIdInOrganization(organizationId, sessionId);
        if (!session) {
            throw new NotFoundError("Session not found");
        }

        const enrollment = await attendancesRepo.upsert({
            organizationId,
            sessionId,
            userId,
        });

        return ctx.json(
            {
                ...enrollment,
                joinedAt: enrollment.joinedAt.getTime(),
            },
            HttpStatusCodes.CREATED
        );
    };

    static deleteEnrollment: AppHandler<typeof EnrollmentRoutes.deleteEnrollment> = async (ctx) => {
        const { organizationId, sessionId, enrollmentId } = ctx.req.valid("param");
        const attendancesRepo = getSessionAttendancesRepository(ctx);
        const deleted = await attendancesRepo.delete(enrollmentId, organizationId, sessionId);
        if (!deleted) {
            throw new NotFoundError("Enrollment not found");
        }
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static getMyEnrollments: AppHandler<typeof EnrollmentRoutes.getMyEnrollments> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const sessionsRepo = getScheduledSessionsRepository(ctx);

        const dashboard = await sessionsRepo.getStudentDashboard({ organizationId, userId });
        return ctx.json(dashboard, HttpStatusCodes.OK);
    };
}
