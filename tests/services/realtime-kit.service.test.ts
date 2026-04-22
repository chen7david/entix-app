import { ForbiddenError } from "@api/errors/app.error";
import type { SessionScheduleRepository } from "@api/repositories/session-schedule.repository";
import { RealtimeKitService } from "@api/services/realtime-kit.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createMemoryKv() {
    const m = new Map<string, string>();
    return {
        get: (key: string, type?: "text" | "json") => {
            const value = m.get(key);
            if (value == null) return Promise.resolve(null);
            if (type === "json") return Promise.resolve(JSON.parse(value));
            return Promise.resolve(value);
        },
        put: (key: string, value: string) => {
            m.set(key, value);
            return Promise.resolve();
        },
        list: ({ prefix }: { prefix?: string }) =>
            Promise.resolve({
                keys: Array.from(m.keys())
                    .filter((key) => (prefix ? key.startsWith(prefix) : true))
                    .map((name) => ({ name })),
            }),
    } as unknown as KVNamespace;
}

describe("RealtimeKitService", () => {
    const accountId = "acc_test";
    const appId = "app_test";
    const orgId = "org_1";
    const sessionId = "ses_1";
    const teacherId = "usr_teacher";
    const studentId = "usr_student";

    const now = Date.now();
    const baseSession = {
        id: sessionId,
        organizationId: orgId,
        title: "Class",
        description: null as string | null,
        teacherUserId: teacherId,
        startTime: new Date(now - 60 * 60 * 1000),
        durationMinutes: 120,
        status: "scheduled" as const,
        seriesId: null as string | null,
        recurrenceRule: null as string | null,
        createdAt: new Date(now - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now - 2 * 60 * 60 * 1000),
        attendances: [{ userId: studentId } as { userId: string }],
    };

    let mockRepo: { findSessionById: ReturnType<typeof vi.fn> };
    let fetchImpl: (url: string, init?: RequestInit) => Promise<Response>;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockRepo = { findSessionById: vi.fn() };
        fetchImpl = () =>
            Promise.resolve(
                new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })
            );
        globalThis.fetch = vi.fn((input: string | URL, init?: RequestInit) =>
            fetchImpl(String(input), init)
        ) as typeof fetch;
    });

    function makeService() {
        return new RealtimeKitService(mockRepo as unknown as SessionScheduleRepository, {
            accountId,
            appId,
            apiToken: "test_token",
            presetOrganizer: "Host",
            presetParticipant: "Guest",
            kv: createMemoryKv(),
        });
    }

    it("mints a token for the teacher (organizer)", async () => {
        mockRepo.findSessionById.mockResolvedValue({ ...baseSession });
        fetchImpl = (url, init) => {
            if (
                url.includes("/meetings") &&
                init?.method === "POST" &&
                !url.includes("participants")
            ) {
                return Promise.resolve(
                    new Response(JSON.stringify({ success: true, data: { id: "meet_1" } }), {
                        status: 200,
                    })
                );
            }
            if (
                url.includes("/participants") &&
                init?.method === "POST" &&
                !url.includes("/token")
            ) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: {
                                id: "part_1",
                                token: "tok_fresh",
                                custom_participant_id: teacherId,
                                preset_name: "Host",
                            },
                        }),
                        { status: 200 }
                    )
                );
            }
            if (url.includes("/participants") && (init?.method === "GET" || !init?.method)) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: [],
                        }),
                        { status: 200 }
                    )
                );
            }
            if (url.includes("/participants") && (init?.method === "GET" || !init?.method)) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: [],
                        }),
                        { status: 200 }
                    )
                );
            }
            if (url.includes("/participants") && (init?.method === "GET" || !init?.method)) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: [],
                        }),
                        { status: 200 }
                    )
                );
            }
            if (url.includes("/participants") && (init?.method === "GET" || !init?.method)) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: [],
                        }),
                        { status: 200 }
                    )
                );
            }
            return Promise.resolve(new Response("unexpected", { status: 500 }));
        };

        const out = await makeService().issueSessionMeetingToken(orgId, sessionId, teacherId);
        expect(out.data.role).toBe("organizer");
        expect(out.data.token).toBe("tok_fresh");
        expect(out.data.meetingId).toBe("meet_1");
        expect(out.data.appId).toBe(appId);
    });

    it("mints a token for an attendee (participant)", async () => {
        mockRepo.findSessionById.mockResolvedValue({ ...baseSession });
        fetchImpl = (url, init) => {
            if (
                url.includes("/meetings") &&
                init?.method === "POST" &&
                !url.includes("participants")
            ) {
                return Promise.resolve(
                    new Response(JSON.stringify({ success: true, data: { id: "meet_1" } }), {
                        status: 200,
                    })
                );
            }
            if (
                url.includes("/participants") &&
                init?.method === "POST" &&
                !url.includes("/token")
            ) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: {
                                id: "part_2",
                                token: "tok_stu",
                                custom_participant_id: studentId,
                                preset_name: "Guest",
                            },
                        }),
                        { status: 200 }
                    )
                );
            }
            if (url.includes("/participants") && (init?.method === "GET" || !init?.method)) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: [],
                        }),
                        { status: 200 }
                    )
                );
            }
            return Promise.resolve(new Response("unexpected", { status: 500 }));
        };

        const service = makeService();
        await service.requestSessionMeetingAdmission(orgId, sessionId, studentId);
        await service.decideSessionMeetingAdmission(
            orgId,
            sessionId,
            teacherId,
            studentId,
            "approved"
        );
        const out = await service.issueSessionMeetingToken(orgId, sessionId, studentId);
        expect(out.data.role).toBe("participant");
        expect(out.data.token).toBe("tok_stu");
    });

    it("rejects users who are not the teacher or an attendee", async () => {
        mockRepo.findSessionById.mockResolvedValue({ ...baseSession });
        await expect(
            makeService().issueSessionMeetingToken(orgId, sessionId, "usr_stranger")
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("on duplicate participant create, lists participants and refreshes token", async () => {
        mockRepo.findSessionById.mockResolvedValue({ ...baseSession });
        let postParticipantsCalls = 0;
        fetchImpl = (url, init) => {
            if (
                url.includes("/meetings") &&
                init?.method === "POST" &&
                !url.includes("participants")
            ) {
                return Promise.resolve(
                    new Response(JSON.stringify({ success: true, data: { id: "meet_1" } }), {
                        status: 200,
                    })
                );
            }
            if (
                url.includes("/participants") &&
                init?.method === "POST" &&
                !url.includes("/token")
            ) {
                postParticipantsCalls += 1;
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: false,
                            errors: [{ message: "duplicate" }],
                        }),
                        { status: 400 }
                    )
                );
            }
            if (url.includes("/participants") && (init?.method === "GET" || !init?.method)) {
                return Promise.resolve(
                    new Response(
                        JSON.stringify({
                            success: true,
                            data: [
                                {
                                    id: "part_existing",
                                    custom_participant_id: teacherId,
                                    preset_name: "Host",
                                },
                            ],
                        }),
                        { status: 200 }
                    )
                );
            }
            if (
                url.includes("/participants/") &&
                url.endsWith("/token") &&
                init?.method === "POST"
            ) {
                return Promise.resolve(
                    new Response(JSON.stringify({ success: true, data: { token: "after_dup" } }), {
                        status: 200,
                    })
                );
            }
            return Promise.resolve(new Response("unexpected", { status: 500 }));
        };

        const out = await makeService().issueSessionMeetingToken(orgId, sessionId, teacherId);
        expect(postParticipantsCalls).toBe(1);
        expect(out.data.token).toBe("after_dup");
    });
});
