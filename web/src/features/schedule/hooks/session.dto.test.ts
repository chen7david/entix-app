import { createSessionSchema } from "@shared";
import { describe, expect, it } from "vitest";

describe("createSessionSchema", () => {
    const basePayload = {
        lessonId: "lesson_123",
        teacherId: "teacher_123",
        userIds: [],
    };

    it("should accept a future-dated session", () => {
        const futureTime = Date.now() + 1000 * 60 * 60; // 1 hour from now
        const result = createSessionSchema.safeParse({
            ...basePayload,
            title: "Future Session",
            startTime: futureTime,
            durationMinutes: 60,
        });
        expect(result.success).toBe(true);
    });

    it("should reject a past-dated session (beyond 1-min grace)", () => {
        const pastTime = Date.now() - 1000 * 120; // 2 minutes ago
        const result = createSessionSchema.safeParse({
            ...basePayload,
            title: "Past Session",
            startTime: pastTime,
            durationMinutes: 60,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                "Session cannot be scheduled in the past"
            );
        }
    });

    it("should accept a very recent past-dated session within 1-min grace", () => {
        const recentTime = Date.now() - 30000; // 30 seconds ago
        const result = createSessionSchema.safeParse({
            ...basePayload,
            title: "Recent Session",
            startTime: recentTime,
            durationMinutes: 60,
        });
        expect(result.success).toBe(true);
    });

    it("should reject an empty title", () => {
        const result = createSessionSchema.safeParse({
            ...basePayload,
            title: "",
            startTime: Date.now() + 10000,
            durationMinutes: 60,
        });
        expect(result.success).toBe(false);
    });

    it("should require duration between 15 and 480 minutes", () => {
        const tooShort = createSessionSchema.safeParse({
            ...basePayload,
            title: "Short",
            startTime: Date.now() + 10000,
            durationMinutes: 10,
        });
        expect(tooShort.success).toBe(false);

        const ok = createSessionSchema.safeParse({
            ...basePayload,
            title: "OK",
            startTime: Date.now() + 10000,
            durationMinutes: 15,
        });
        expect(ok.success).toBe(true);
    });
});
