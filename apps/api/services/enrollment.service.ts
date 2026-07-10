import { BadRequestError, ForbiddenError, NotFoundError } from "@api/errors/app.error";
import { parseAuthMemberRoles } from "@api/helpers/auth-member-role.helpers";
import type { MemberRepository } from "@api/repositories/member.repository";
import type { ScheduledSessionsRepository } from "@api/repositories/scheduled-sessions.repository";
import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { SessionScheduleService } from "@api/services/session-schedule.service";
import { BaseService } from "./base.service";

export class EnrollmentService extends BaseService {
    constructor(
        private readonly scheduledSessionsRepo: ScheduledSessionsRepository,
        private readonly attendancesRepo: SessionAttendancesRepository,
        private readonly memberRepo: MemberRepository,
        private readonly sessionScheduleService: SessionScheduleService
    ) {
        super();
    }

    async createEnrollment(params: { organizationId: string; sessionId: string; userId: string }) {
        const { organizationId, sessionId, userId } = params;

        if (!userId) {
            throw new BadRequestError("Missing userId for enrollment");
        }

        const session = await this.scheduledSessionsRepo.findByIdInOrganization(
            organizationId,
            sessionId
        );
        if (!session) {
            throw new NotFoundError("Session not found");
        }

        const membership = await this.memberRepo.find(userId, organizationId);
        const roles = parseAuthMemberRoles(membership?.role);
        if (!membership || !roles.includes("student")) {
            throw new ForbiddenError("User is not a student in this organization");
        }

        return this.attendancesRepo.upsert({
            organizationId,
            sessionId,
            userId,
        });
    }

    async deleteEnrollment(
        organizationId: string,
        sessionId: string,
        enrollmentId: string
    ): Promise<void> {
        const deleted = await this.attendancesRepo.delete(enrollmentId, organizationId, sessionId);
        if (!deleted) {
            throw new NotFoundError("Enrollment not found");
        }
    }

    async getMyEnrollments(organizationId: string, userId: string) {
        return this.sessionScheduleService.getStudentEnrollmentDashboard(organizationId, userId);
    }
}
