import { createRouter } from "@api/lib/app.lib";
import { EnrollmentHandlers } from "./enrollment.handlers";
import { EnrollmentRoutes } from "./enrollment.routes";

export const enrollmentRoutes = createRouter()
    .openapi(EnrollmentRoutes.createEnrollment, EnrollmentHandlers.createEnrollment)
    .openapi(EnrollmentRoutes.deleteEnrollment, EnrollmentHandlers.deleteEnrollment)
    .openapi(EnrollmentRoutes.getMyEnrollments, EnrollmentHandlers.getMyEnrollments);
