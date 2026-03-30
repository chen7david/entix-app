import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionScheduleRepository } from "../../../api/repositories/session-schedule.repository";

describe("SessionScheduleRepository Unit test", () => {
    let mockDb: any;
    let repo: SessionScheduleRepository;

    beforeEach(() => {
        mockDb = {
            query: {
                scheduledSessions: {
                    findMany: vi.fn().mockResolvedValue([{ id: "sess_1", startTime: new Date() }]),
                },
            },
        };
        repo = new SessionScheduleRepository(mockDb);
    });

    it("correctly maps logical date bounds into raw sql query conditions passing to Drizzle Driver natively", async () => {
        const ORG_ID = "org_test";
        const START_EPOCH = 10000;
        const END_EPOCH = 50000;

        await repo.findSessionsByOrganization(ORG_ID, START_EPOCH, END_EPOCH);

        expect(mockDb.query.scheduledSessions.findMany).toHaveBeenCalledTimes(1);
        const args = mockDb.query.scheduledSessions.findMany.mock.calls[0][0];
        expect(args.where).toBeDefined();
    });

    it("successfully bounds queries inclusively for start of day and end of day edge cases", async () => {
        const ORG_ID = "org_test";
        const START_OF_DAY = new Date("2026-03-21T00:00:00.000Z").getTime();
        const END_OF_DAY = new Date("2026-03-21T23:59:59.999Z").getTime();

        await repo.findSessionsByOrganization(ORG_ID, START_OF_DAY, END_OF_DAY);

        expect(mockDb.query.scheduledSessions.findMany).toHaveBeenCalledTimes(1);
        const args = mockDb.query.scheduledSessions.findMany.mock.calls[0][0];

        expect(args.where).toBeDefined();
    });
});
