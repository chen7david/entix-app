import { env } from "cloudflare:test";
import app from "@api/app";
import * as schema from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestDb } from "../lib/utils";

describe("Vocabulary Integration Test", () => {
    let db: ReturnType<typeof createTestDb> extends Promise<infer U> ? U : never;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("GET /api/v1/orgs/:orgId/sessions/:sessionId/vocabulary should return 200", async () => {
        const { cookie, orgId, orgData } = await createAuthenticatedOrg({ app, env });
        const ownerEmail = orgData.data.user.email;
        const owner = await db.query.authUsers.findFirst({
            where: eq(schema.authUsers.email, ownerEmail),
        });
        expect(owner).toBeDefined();
        if (!owner) {
            throw new Error("Expected organization owner to exist in authUsers");
        }

        const [lesson] = await db
            .insert(schema.lessons)
            .values({
                organizationId: orgId,
                title: "Session Vocabulary Lesson",
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        expect(lesson).toBeDefined();

        const [session] = await db
            .insert(schema.scheduledSessions)
            .values({
                organizationId: orgId,
                lessonId: lesson.id,
                teacherId: owner.id,
                title: "Vocabulary Session",
                startTime: new Date(),
                durationMinutes: 60,
                status: "scheduled",
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        const [attendance] = await db
            .insert(schema.sessionAttendances)
            .values({
                sessionId: session.id,
                organizationId: orgId,
                userId: owner.id,
                joinedAt: new Date(),
                absent: false,
                paymentStatus: "unpaid",
            })
            .returning();

        const [vocab] = await db
            .insert(schema.vocabularyBank)
            .values({
                text: `vocab-${Date.now()}`,
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        await db.insert(schema.studentVocabulary).values({
            userId: owner.id,
            organizationId: orgId,
            vocabularyId: vocab.id,
            attendanceId: attendance.id,
            createdAt: new Date(),
        });

        const res = await app.request(
            new Request(`http://localhost/api/v1/orgs/${orgId}/sessions/${session.id}/vocabulary`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookie,
                },
            }),
            {},
            env
        );

        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            data: Array<{ organizationId: string; vocabulary: { id: string } }>;
        };
        expect(body.data.length).toBe(1);
        expect(body.data[0]?.organizationId).toBe(orgId);
        expect(body.data[0]?.vocabulary.id).toBe(vocab.id);
    });
});
