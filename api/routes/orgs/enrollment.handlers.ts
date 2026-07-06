import { BadRequestError } from "@api/errors/app.error";
import { getEnrollmentService } from "@api/factories/service.factory";
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

        const service = getEnrollmentService(ctx);
        const enrollment = await service.createEnrollment({
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
        const service = getEnrollmentService(ctx);
        await service.deleteEnrollment(organizationId, sessionId, enrollmentId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static getMyEnrollments: AppHandler<typeof EnrollmentRoutes.getMyEnrollments> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const userId = ctx.get("userId");
        const service = getEnrollmentService(ctx);
        const dashboard = await service.getMyEnrollments(organizationId, userId);
        return ctx.json(dashboard, HttpStatusCodes.OK);
    };
}
