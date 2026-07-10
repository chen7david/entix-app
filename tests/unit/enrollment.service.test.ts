import { ForbiddenError, NotFoundError } from "@api/errors/app.error";
import { EnrollmentService } from "@api/services/schedule/enrollment.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    findSessionByIdInOrganization: vi.fn(),
    upsert: vi.fn(),
    findMember: vi.fn(),
    getStudentEnrollmentDashboard: vi.fn(),
}));

describe("EnrollmentService.createEnrollment", () => {
    let service: EnrollmentService;

    beforeEach(() => {
        vi.resetAllMocks();
        service = new EnrollmentService(
            { findByIdInOrganization: mocks.findSessionByIdInOrganization } as any,
            { upsert: mocks.upsert } as any,
            { find: mocks.findMember } as any,
            { getStudentEnrollmentDashboard: mocks.getStudentEnrollmentDashboard } as any
        );
    });

    it("returns 403 when target user is not a student in organization", async () => {
        mocks.findSessionByIdInOrganization.mockResolvedValue({ id: "session_1" });
        mocks.findMember.mockResolvedValue({ role: "teacher" });

        await expect(
            service.createEnrollment({
                organizationId: "org_1",
                sessionId: "session_1",
                userId: "user_1",
            })
        ).rejects.toBeInstanceOf(ForbiddenError);
        expect(mocks.upsert).not.toHaveBeenCalled();
    });

    it("returns 403 when target user is not a member of the organization", async () => {
        mocks.findSessionByIdInOrganization.mockResolvedValue({ id: "session_1" });
        mocks.findMember.mockResolvedValue(null);

        await expect(
            service.createEnrollment({
                organizationId: "org_1",
                sessionId: "session_1",
                userId: "user_other_org",
            })
        ).rejects.toBeInstanceOf(ForbiddenError);
        expect(mocks.upsert).not.toHaveBeenCalled();
    });

    it("creates enrollment for valid student member", async () => {
        const joinedAt = new Date();
        mocks.findSessionByIdInOrganization.mockResolvedValue({ id: "session_1" });
        mocks.findMember.mockResolvedValue({ role: "student,teacher" });
        mocks.upsert.mockResolvedValue({
            id: "att_1",
            organizationId: "org_1",
            sessionId: "session_1",
            userId: "user_1",
            joinedAt,
        });

        const result = await service.createEnrollment({
            organizationId: "org_1",
            sessionId: "session_1",
            userId: "user_1",
        });

        expect(mocks.upsert).toHaveBeenCalledWith({
            organizationId: "org_1",
            sessionId: "session_1",
            userId: "user_1",
        });
        expect(result).toMatchObject({
            id: "att_1",
            joinedAt,
        });
    });

    it("returns 404 when session does not exist", async () => {
        mocks.findSessionByIdInOrganization.mockResolvedValue(null);

        await expect(
            service.createEnrollment({
                organizationId: "org_1",
                sessionId: "session_missing",
                userId: "user_1",
            })
        ).rejects.toBeInstanceOf(NotFoundError);
    });
});
