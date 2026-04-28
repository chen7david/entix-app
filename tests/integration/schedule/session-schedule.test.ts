import { addWeeks } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionScheduleService } from "../../../api/services/session-schedule.service";

describe("SessionScheduleService Architecture Bounds", () => {
    let mockRepo: any;
    let service: SessionScheduleService;
    const lessonId = "lesson_sched_test";
    const teacherId = "teacher_sched_test";

    const mockSessionPaymentService = {
        processSessionPayment: vi.fn().mockResolvedValue(undefined),
    } as any;

    const mockAuditRepo = {
        insert: vi.fn().mockResolvedValue(undefined),
        prepareInsert: vi.fn(),
        list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
        acknowledge: vi.fn().mockResolvedValue(undefined),
    } as any;

    beforeEach(() => {
        mockRepo = {
            createSessions: vi.fn().mockImplementation((sessions) =>
                Promise.resolve(
                    sessions.map((s: any) => ({
                        ...s,
                        id: `mock_uuid_${Math.random().toString(36).slice(2)}`,
                    }))
                )
            ),
            addAttendances: vi.fn().mockResolvedValue([]),
            findSessionById: vi.fn(),
            updateSessionDetails: vi.fn(),
            deleteAllSessionAttendances: vi.fn(),
            deleteFollowingSessions: vi.fn(),
        };
        const mockBilling = {} as any;
        const mockWallet = {} as any;
        service = new SessionScheduleService(
            mockRepo,
            mockBilling,
            mockWallet,
            mockSessionPaymentService,
            mockAuditRepo
        );
    });

    it("creates a single session effortlessly scaling Drizzle mapping", async () => {
        const payload = {
            lessonId,
            teacherId,
            title: "Physics 101",
            startTime: Date.now(),
            durationMinutes: 60,
            userIds: ["usr_123"],
        };

        const result = await service.createSession("org_1", payload);
        expect(result).toHaveLength(1);
        expect(mockRepo.createSessions).toHaveBeenCalledTimes(1);
        expect(mockRepo.addAttendances).toHaveBeenCalledTimes(1);
        expect(mockRepo.addAttendances).toHaveBeenCalledWith([
            {
                sessionId: result[0].id,
                organizationId: "org_1",
                userId: "usr_123",
            },
        ]);
    });

    it("generates 4 recurring weekly sessions identically pinned via seriesId", async () => {
        const payload = {
            lessonId,
            teacherId,
            title: "Advanced Mathematics",
            startTime: new Date("2026-03-20T10:00:00Z").getTime(),
            durationMinutes: 45,
            userIds: ["usr_abc", "usr_xyz"],
            recurrence: { frequency: "weekly" as const, count: 4 },
        };

        const result = await service.createSession("org_1", payload);

        expect(result).toHaveLength(4);
        expect(result[0].seriesId).toBeDefined();
        expect(result[0].seriesId).toEqual(result[3].seriesId); // all arrays grouped safely

        const timeDiff = result[1].startTime.getTime() - result[0].startTime.getTime();
        expect(timeDiff).toBe(7 * 24 * 60 * 60 * 1000);

        expect(mockRepo.addAttendances).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ userId: "usr_abc" }),
                expect.objectContaining({ userId: "usr_xyz" }),
            ])
        );
    });

    it("cascades an update forward flawlessly replacing downstream sequences", async () => {
        const mockOriginalStartDate = new Date("2026-03-20T10:00:00Z").getTime();
        mockRepo.findSessionById.mockResolvedValue({
            id: "sess_anchor",
            seriesId: "series_123",
            startTime: mockOriginalStartDate,
            recurrenceRule: "FREQ=WEEKLY;COUNT=4",
        });

        mockRepo.deleteFollowingSessions.mockResolvedValue([
            { id: "sess_anchor" },
            { id: "sess_next1" },
            { id: "sess_next2" },
        ]);

        const NEW_START_TIME = new Date("2026-03-21T11:00:00Z").getTime(); // shifting by 1 day and 1 hr

        const payload = {
            lessonId,
            teacherId,
            title: "Advanced Math Revamped",
            startTime: NEW_START_TIME,
            durationMinutes: 90,
            userIds: ["usr_abc"],
            updateForward: true,
        };

        const result = await service.updateSession("org_1", "sess_anchor", payload);

        expect(result.success).toBe(true);
        expect(mockRepo.deleteFollowingSessions).toHaveBeenCalledWith(
            "series_123",
            mockOriginalStartDate
        );

        expect(mockRepo.createSessions).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    title: "Advanced Math Revamped",
                    durationMinutes: 90,
                    seriesId: "series_123",
                }),
            ])
        );

        const insertedData = mockRepo.createSessions.mock.calls[0][0];
        expect(insertedData).toHaveLength(3);
        expect(insertedData[0].startTime.getTime()).toBe(NEW_START_TIME);
        expect(insertedData[2].startTime.getTime()).toBe(addWeeks(NEW_START_TIME, 2).getTime());
    });

    it("generates 3 recurring daily sessions correctly", async () => {
        const payload = {
            lessonId,
            teacherId,
            title: "Daily Standup",
            startTime: new Date("2026-03-20T09:00:00Z").getTime(),
            durationMinutes: 15,
            userIds: ["usr_1"],
            recurrence: { frequency: "daily" as const, count: 3 },
        };

        const result = await service.createSession("org_1", payload);

        expect(result).toHaveLength(3);
        const timeDiff = result[1].startTime.getTime() - result[0].startTime.getTime();
        expect(timeDiff).toBe(24 * 60 * 60 * 1000); // 1 day
    });

    it("generates 3 recurring monthly sessions correctly skipping across month boundaries", async () => {
        const payload = {
            lessonId,
            teacherId,
            title: "Monthly Review",
            startTime: new Date("2026-03-31T10:00:00Z").getTime(),
            durationMinutes: 60,
            userIds: ["usr_1"],
            recurrence: { frequency: "monthly" as const, count: 3 },
        };

        const result = await service.createSession("org_1", payload);

        expect(result).toHaveLength(3);
        // March 31 -> April 30 -> May 31
        expect(result[0].startTime.toISOString()).toContain("03-31");
        expect(result[1].startTime.toISOString()).toContain("04-30"); // April logic
        expect(result[2].startTime.toISOString()).toContain("05-31");
    });
});
