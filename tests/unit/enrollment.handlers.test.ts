import { ForbiddenError, NotFoundError } from "@api/errors/app.error";
import { EnrollmentHandlers } from "@api/routes/orgs/enrollment.handlers";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    findSessionByIdInOrganization: vi.fn(),
    upsert: vi.fn(),
    findMember: vi.fn(),
}));

type CreateEnrollmentCtx = Parameters<typeof EnrollmentHandlers.createEnrollment>[0];

vi.mock("@api/factories/repository.factory", () => ({
    getScheduledSessionsRepository: () => ({
        findByIdInOrganization: mocks.findSessionByIdInOrganization,
    }),
    getSessionAttendancesRepository: () => ({
        upsert: mocks.upsert,
    }),
    getMemberRepository: () => ({
        find: mocks.findMember,
    }),
}));

describe("EnrollmentHandlers.createEnrollment", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns 403 when target user is not a student in organization", async () => {
        mocks.findSessionByIdInOrganization.mockResolvedValue({ id: "session_1" });
        mocks.findMember.mockResolvedValue({ role: "teacher" });

        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_1" },
            { userId: "user_1" },
            vi.fn()
        );

        await expect(
            EnrollmentHandlers.createEnrollment(
                ctx as unknown as CreateEnrollmentCtx,
                undefined as never
            )
        ).rejects.toBeInstanceOf(ForbiddenError);
        expect(mocks.upsert).not.toHaveBeenCalled();
    });

    it("returns 403 when target user is not a member of the organization", async () => {
        mocks.findSessionByIdInOrganization.mockResolvedValue({ id: "session_1" });
        mocks.findMember.mockResolvedValue(null);

        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_1" },
            { userId: "user_other_org" },
            vi.fn()
        );

        await expect(
            EnrollmentHandlers.createEnrollment(
                ctx as unknown as CreateEnrollmentCtx,
                undefined as never
            )
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
        const json = vi.fn();

        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_1" },
            { userId: "user_1" },
            json
        );

        await EnrollmentHandlers.createEnrollment(
            ctx as unknown as CreateEnrollmentCtx,
            undefined as never
        );

        expect(mocks.upsert).toHaveBeenCalledWith({
            organizationId: "org_1",
            sessionId: "session_1",
            userId: "user_1",
        });
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "att_1",
                joinedAt: joinedAt.getTime(),
            }),
            expect.any(Number)
        );
    });

    it("returns 404 when session does not exist", async () => {
        mocks.findSessionByIdInOrganization.mockResolvedValue(null);
        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_missing" },
            { userId: "user_1" },
            vi.fn()
        );

        await expect(
            EnrollmentHandlers.createEnrollment(
                ctx as unknown as CreateEnrollmentCtx,
                undefined as never
            )
        ).rejects.toBeInstanceOf(NotFoundError);
    });
});

function makeCtx(params: unknown, body: unknown, json: ReturnType<typeof vi.fn>) {
    return {
        req: {
            valid: (source: "param" | "json") => (source === "param" ? params : body),
        },
        get: vi.fn(),
        json,
    };
}
