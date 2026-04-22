import {
    BadRequestError,
    ForbiddenError,
    InternalServerError,
    NotFoundError,
    ServiceUnavailableError,
} from "@api/errors/app.error";
import type { SessionScheduleRepository } from "@api/repositories/session-schedule.repository";
import { BaseService } from "./base.service";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

/** How long to cache Cloudflare Realtime meeting + participant id mappings in KV. */
const RTK_KV_TTL_SEC = 60 * 60 * 24 * 7;

const RTK_KEY_MEET = (orgId: string, sessionId: string) => `rtk:meet:${orgId}:${sessionId}`;
const RTK_KEY_PART = (meetingId: string, userId: string) => `rtk:part:${meetingId}:${userId}`;
const RTK_KEY_WAIT = (orgId: string, sessionId: string, userId: string) =>
    `rtk:wait:${orgId}:${sessionId}:${userId}`;
const RTK_KEY_WAIT_PREFIX = (orgId: string, sessionId: string) => `rtk:wait:${orgId}:${sessionId}:`;
const RTK_KEY_MUTE = (orgId: string, sessionId: string, userId: string) =>
    `rtk:mute:${orgId}:${sessionId}:${userId}`;
const RTK_KEY_LOCK = (orgId: string, sessionId: string) => `rtk:lock:${orgId}:${sessionId}`;
const RTK_KEY_UNMUTE_REQ = (orgId: string, sessionId: string, userId: string) =>
    `rtk:unmute:${orgId}:${sessionId}:${userId}`;
const RTK_KEY_UNMUTE_REQ_PREFIX = (orgId: string, sessionId: string) =>
    `rtk:unmute:${orgId}:${sessionId}:`;
const RTK_MEETING_MAX_PARTICIPANTS = 25;

type CfV4List<T> = {
    success: boolean;
    data?: T;
    result?: T;
    errors?: { code?: number; message: string }[];
};

type MeetingRow = { id: string; title?: string | null };
type ParticipantRow = {
    id: string;
    token?: string;
    custom_participant_id: string;
    preset_name: string;
    name?: string | null;
    picture?: string | null;
};

export type RealtimeKitServiceConfig = {
    accountId: string;
    appId: string;
    apiToken: string | undefined;
    presetOrganizer: string;
    presetParticipant: string;
    kv: KVNamespace;
};

type MeetingRole = "organizer" | "participant";
type WaitingStatus = "not_requested" | "pending" | "approved" | "denied";
type WaitingRecord = {
    userId: string;
    status: Exclude<WaitingStatus, "not_requested">;
    role: MeetingRole;
    requestedAt: number;
    decidedAt?: number;
    decidedBy?: string;
    displayName?: string | null;
    email?: string | null;
    image?: string | null;
};
type MeetingParticipantView = {
    userId: string;
    participantId: string;
    name?: string | null;
    image?: string | null;
    isOrganizer: boolean;
    forceMuted: boolean;
};
type UnmuteRequestRecord = {
    userId: string;
    status: "pending" | "approved" | "denied";
    requestedAt: number;
    decidedAt?: number;
    decidedBy?: string;
};

/**
 * Server-side Realtime Kit / Cloudflare REST integration for session meetings.
 * Mints short-lived join tokens only after org + session + role checks.
 */
export class RealtimeKitService extends BaseService {
    constructor(
        private readonly sessionRepo: SessionScheduleRepository,
        private readonly config: RealtimeKitServiceConfig
    ) {
        super();
    }

    private async cloudflareRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
        const { apiToken, accountId, appId } = this.config;
        if (!apiToken) {
            throw new ServiceUnavailableError(
                "Realtime is not configured (missing CLOUDFLARE_API_TOKEN)"
            );
        }
        if (!appId) {
            throw new ServiceUnavailableError(
                "Realtime is not configured (missing REALTIME_KIT_APP_ID)"
            );
        }
        if (!path.startsWith(`/accounts/${accountId}/realtime/kit/${appId}`)) {
            path = `/accounts/${accountId}/realtime/kit/${appId}${path.startsWith("/") ? path : `/${path}`}`;
        }
        const method = init.method ?? "GET";
        const res = await fetch(`${CF_API_BASE}${path}`, {
            ...init,
            headers: {
                ...(method !== "GET" && method !== "HEAD"
                    ? { "Content-Type": "application/json" }
                    : {}),
                Authorization: `Bearer ${apiToken}`,
                ...init.headers,
            },
        });
        const body = (await res.json()) as CfV4List<T> | Record<string, unknown>;
        if (!res.ok) {
            const msg = JSON.stringify(body);
            throw new InternalServerError(`Cloudflare API error: ${res.status} ${msg}`);
        }
        if (
            typeof body === "object" &&
            body !== null &&
            "success" in body &&
            body.success === false
        ) {
            const errList = (body as CfV4List<unknown>).errors;
            const msg = errList?.map((e) => e.message).join("; ") || JSON.stringify(body);
            throw new InternalServerError(`Cloudflare API: ${msg}`);
        }
        const d = (body as CfV4List<T>).data ?? (body as CfV4List<T>).result;
        if (d === undefined) {
            throw new InternalServerError("Cloudflare API returned no data");
        }
        return d;
    }

    private assertSessionJoinWindow(startTimeMs: number, durationMinutes: number): void {
        const EARLY_MS = 15 * 60 * 1000;
        const LATE_MS = 2 * 60 * 60 * 1000;
        const endMs = startTimeMs + durationMinutes * 60 * 1000;
        const now = Date.now();
        if (now < startTimeMs - EARLY_MS || now > endMs + LATE_MS) {
            throw new ForbiddenError("This meeting is not open for joining at this time");
        }
    }

    private isOrganizer(teacherUserId: string, userId: string): boolean {
        return teacherUserId === userId;
    }

    private async assertOrganizerRole(organizationId: string, sessionId: string, userId: string) {
        const { role } = await this.getJoinContext(organizationId, sessionId, userId);
        if (role !== "organizer") {
            throw new ForbiddenError("Only organizers can perform this action");
        }
    }

    private async getMeetingRuntimeStatus(
        organizationId: string,
        sessionId: string,
        title: string
    ) {
        const meetingId = await this.getOrCreateMeeting(
            organizationId,
            sessionId,
            title || `Session ${sessionId}`
        );
        const participants = await this.cloudflareRequest<ParticipantRow[]>(
            `/meetings/${meetingId}/participants`,
            { method: "GET" }
        );
        const locked =
            (await this.config.kv.get(RTK_KEY_LOCK(organizationId, sessionId), "text")) === "1";
        return {
            meetingId,
            participantCount: Array.isArray(participants) ? participants.length : 0,
            maxParticipants: RTK_MEETING_MAX_PARTICIPANTS,
            locked,
        };
    }

    private async getJoinContext(organizationId: string, sessionId: string, userId: string) {
        const session = await this.sessionRepo.findSessionById(organizationId, sessionId);
        if (!session) throw new NotFoundError("Session not found");
        if (!session.teacherUserId) throw new BadRequestError("Session has no teacher assigned");

        this.assertSessionJoinWindow(
            session.startTime instanceof Date
                ? session.startTime.getTime()
                : new Date(session.startTime).getTime(),
            session.durationMinutes
        );

        const isOrg = this.isOrganizer(session.teacherUserId, userId);
        const attendee = session.attendances?.find((a) => a.userId === userId);
        if (!isOrg && !attendee) {
            throw new ForbiddenError("You are not allowed to join this session meeting");
        }
        const role = isOrg ? ("organizer" as const) : ("participant" as const);
        return { session, role, attendee };
    }

    async requestSessionMeetingAdmission(
        organizationId: string,
        sessionId: string,
        userId: string
    ) {
        const { session, role, attendee } = await this.getJoinContext(
            organizationId,
            sessionId,
            userId
        );
        const key = RTK_KEY_WAIT(organizationId, sessionId, userId);
        const existing = await this.config.kv.get<WaitingRecord>(key, "json");
        if (existing) {
            return {
                data: {
                    status: existing.status,
                    role: existing.role,
                },
            };
        }

        const now = Date.now();
        const isOrganizer = role === "organizer";
        if (!isOrganizer) {
            const room = await this.getMeetingRuntimeStatus(
                organizationId,
                sessionId,
                session.title || ""
            );
            if (room.locked) throw new ForbiddenError("Meeting room is locked by the organizer");
            if (room.participantCount >= room.maxParticipants) {
                throw new ForbiddenError("Meeting room is at maximum capacity");
            }
        }
        const record: WaitingRecord = {
            userId,
            role,
            status: isOrganizer ? "approved" : "pending",
            requestedAt: now,
            ...(isOrganizer ? { decidedAt: now, decidedBy: userId } : {}),
            displayName:
                (isOrganizer
                    ? (session.teacher?.name ?? undefined) || (session.teacher?.email ?? undefined)
                    : (attendee?.user?.name ?? undefined)) ||
                (attendee?.user?.email ?? undefined) ||
                (isOrganizer ? session.teacherUserId : userId),
            email: isOrganizer ? session.teacher?.email : attendee?.user?.email,
            image: (isOrganizer ? session.teacher?.image : attendee?.user?.image) ?? null,
        };
        await this.config.kv.put(key, JSON.stringify(record), { expirationTtl: RTK_KV_TTL_SEC });

        return {
            data: {
                status: record.status,
                role: record.role,
            },
        };
    }

    async getSessionMeetingAdmissionStatus(
        organizationId: string,
        sessionId: string,
        userId: string
    ) {
        const { role } = await this.getJoinContext(organizationId, sessionId, userId);
        const key = RTK_KEY_WAIT(organizationId, sessionId, userId);
        const existing = await this.config.kv.get<WaitingRecord>(key, "json");
        return {
            data: {
                status: (existing?.status ?? "not_requested") as WaitingStatus,
                role,
            },
        };
    }

    async listSessionMeetingPendingAdmissions(
        organizationId: string,
        sessionId: string,
        userId: string
    ) {
        const { role } = await this.getJoinContext(organizationId, sessionId, userId);
        if (role !== "organizer")
            throw new ForbiddenError("Only organizers can review waiting room");

        const list = await this.config.kv.list({
            prefix: RTK_KEY_WAIT_PREFIX(organizationId, sessionId),
        });
        const entries = await Promise.all(
            list.keys.map(async (key) => this.config.kv.get<WaitingRecord>(key.name, "json"))
        );
        return {
            data: {
                items: entries
                    .filter(
                        (item): item is WaitingRecord =>
                            !!item &&
                            item.status === "pending" &&
                            item.role === "participant" &&
                            !!item.userId
                    )
                    .sort((a, b) => a.requestedAt - b.requestedAt),
            },
        };
    }

    async decideSessionMeetingAdmission(
        organizationId: string,
        sessionId: string,
        organizerUserId: string,
        targetUserId: string,
        decision: "approved" | "denied"
    ) {
        const { role } = await this.getJoinContext(organizationId, sessionId, organizerUserId);
        if (role !== "organizer")
            throw new ForbiddenError("Only organizers can review waiting room");

        const targetCtx = await this.getJoinContext(organizationId, sessionId, targetUserId);
        if (targetCtx.role !== "participant") {
            throw new BadRequestError("Organizers do not require waiting room approval");
        }

        const key = RTK_KEY_WAIT(organizationId, sessionId, targetUserId);
        const existing = await this.config.kv.get<WaitingRecord>(key, "json");
        const next: WaitingRecord = {
            userId: targetUserId,
            role: "participant",
            status: decision,
            requestedAt: existing?.requestedAt ?? Date.now(),
            decidedAt: Date.now(),
            decidedBy: organizerUserId,
            displayName: existing?.displayName,
            email: existing?.email,
            image: existing?.image ?? null,
        };
        await this.config.kv.put(key, JSON.stringify(next), { expirationTtl: RTK_KV_TTL_SEC });
        return {
            data: {
                status: decision,
            },
        };
    }

    async listSessionMeetingParticipants(
        organizationId: string,
        sessionId: string,
        userId: string
    ) {
        const { role } = await this.getJoinContext(organizationId, sessionId, userId);
        if (role !== "organizer")
            throw new ForbiddenError("Only organizers can view participant roster");

        const session = await this.sessionRepo.findSessionById(organizationId, sessionId);
        if (!session?.teacherUserId) throw new NotFoundError("Session not found");
        const meetingId = await this.getOrCreateMeeting(
            organizationId,
            sessionId,
            session.title || `Session ${sessionId}`
        );
        const list = await this.cloudflareRequest<ParticipantRow[]>(
            `/meetings/${meetingId}/participants`,
            { method: "GET" }
        );
        const participants: MeetingParticipantView[] = [];
        for (const p of Array.isArray(list) ? list : []) {
            const memberUserId = p.custom_participant_id;
            const forceMuted =
                (await this.config.kv.get(
                    RTK_KEY_MUTE(organizationId, sessionId, memberUserId)
                )) === "1";
            participants.push({
                userId: memberUserId,
                participantId: p.id,
                name: p.name ?? null,
                image: p.picture ?? null,
                isOrganizer: memberUserId === session.teacherUserId,
                forceMuted,
            });
        }
        return { data: { items: participants } };
    }

    async getSessionMeetingRoomStatus(organizationId: string, sessionId: string, userId: string) {
        const { session } = await this.getJoinContext(organizationId, sessionId, userId);
        const room = await this.getMeetingRuntimeStatus(
            organizationId,
            sessionId,
            session.title || ""
        );
        return {
            data: {
                locked: room.locked,
                participantCount: room.participantCount,
                maxParticipants: room.maxParticipants,
            },
        };
    }

    async setSessionMeetingRoomLock(
        organizationId: string,
        sessionId: string,
        organizerUserId: string,
        locked: boolean
    ) {
        await this.assertOrganizerRole(organizationId, sessionId, organizerUserId);
        await this.config.kv.put(RTK_KEY_LOCK(organizationId, sessionId), locked ? "1" : "0", {
            expirationTtl: RTK_KV_TTL_SEC,
        });
        return { data: { locked } };
    }

    async setSessionMeetingParticipantMute(
        organizationId: string,
        sessionId: string,
        organizerUserId: string,
        targetUserId: string,
        forceMuted: boolean
    ) {
        const { role } = await this.getJoinContext(organizationId, sessionId, organizerUserId);
        if (role !== "organizer")
            throw new ForbiddenError("Only organizers can moderate participants");

        await this.getJoinContext(organizationId, sessionId, targetUserId);
        const key = RTK_KEY_MUTE(organizationId, sessionId, targetUserId);
        await this.config.kv.put(key, forceMuted ? "1" : "0", { expirationTtl: RTK_KV_TTL_SEC });
        if (!forceMuted) {
            await this.config.kv.put(
                RTK_KEY_UNMUTE_REQ(organizationId, sessionId, targetUserId),
                JSON.stringify({
                    userId: targetUserId,
                    status: "approved",
                    requestedAt: Date.now(),
                    decidedAt: Date.now(),
                    decidedBy: organizerUserId,
                } satisfies UnmuteRequestRecord),
                { expirationTtl: RTK_KV_TTL_SEC }
            );
        }
        return { data: { userId: targetUserId, forceMuted } };
    }

    async getSessionMeetingParticipantMuteStatus(
        organizationId: string,
        sessionId: string,
        userId: string
    ) {
        await this.getJoinContext(organizationId, sessionId, userId);
        const forceMuted =
            (await this.config.kv.get(RTK_KEY_MUTE(organizationId, sessionId, userId))) === "1";
        return { data: { userId, forceMuted } };
    }

    async removeSessionMeetingParticipant(
        organizationId: string,
        sessionId: string,
        organizerUserId: string,
        targetUserId: string
    ) {
        const { role } = await this.getJoinContext(organizationId, sessionId, organizerUserId);
        if (role !== "organizer")
            throw new ForbiddenError("Only organizers can moderate participants");
        const targetCtx = await this.getJoinContext(organizationId, sessionId, targetUserId);
        if (targetCtx.role === "organizer") {
            throw new BadRequestError("Organizer cannot be removed");
        }

        const session = await this.sessionRepo.findSessionById(organizationId, sessionId);
        if (!session) throw new NotFoundError("Session not found");
        const meetingId = await this.getOrCreateMeeting(
            organizationId,
            sessionId,
            session.title || `Session ${sessionId}`
        );
        const participantId = await this.findParticipantIdByCustomId(meetingId, targetUserId);
        if (!participantId) throw new NotFoundError("Participant is not currently in meeting");

        await this.cloudflareRequest<Record<string, never>>(
            `/meetings/${meetingId}/participants/${participantId}`,
            { method: "DELETE" }
        );
        await this.config.kv.put(
            RTK_KEY_WAIT(organizationId, sessionId, targetUserId),
            JSON.stringify({
                userId: targetUserId,
                role: "participant",
                status: "denied",
                requestedAt: Date.now(),
                decidedAt: Date.now(),
                decidedBy: organizerUserId,
            } satisfies WaitingRecord),
            { expirationTtl: RTK_KV_TTL_SEC }
        );
        return { data: { removed: true, userId: targetUserId } };
    }

    async requestSessionMeetingUnmute(organizationId: string, sessionId: string, userId: string) {
        await this.getJoinContext(organizationId, sessionId, userId);
        const muted =
            (await this.config.kv.get(RTK_KEY_MUTE(organizationId, sessionId, userId), "text")) ===
            "1";
        if (!muted) {
            throw new BadRequestError("You are not force-muted");
        }
        const record: UnmuteRequestRecord = {
            userId,
            status: "pending",
            requestedAt: Date.now(),
        };
        await this.config.kv.put(
            RTK_KEY_UNMUTE_REQ(organizationId, sessionId, userId),
            JSON.stringify(record),
            { expirationTtl: RTK_KV_TTL_SEC }
        );
        return { data: record };
    }

    async getSessionMeetingUnmuteRequestStatus(
        organizationId: string,
        sessionId: string,
        userId: string
    ) {
        await this.getJoinContext(organizationId, sessionId, userId);
        const record = await this.config.kv.get<UnmuteRequestRecord>(
            RTK_KEY_UNMUTE_REQ(organizationId, sessionId, userId),
            "json"
        );
        return {
            data: {
                status: (record?.status ?? "none") as "none" | "pending" | "approved" | "denied",
            },
        };
    }

    async listSessionMeetingUnmuteRequests(
        organizationId: string,
        sessionId: string,
        organizerUserId: string
    ) {
        await this.assertOrganizerRole(organizationId, sessionId, organizerUserId);
        const keys = await this.config.kv.list({
            prefix: RTK_KEY_UNMUTE_REQ_PREFIX(organizationId, sessionId),
        });
        const records = await Promise.all(
            keys.keys.map((k) => this.config.kv.get<UnmuteRequestRecord>(k.name, "json"))
        );
        return {
            data: {
                items: records
                    .filter((r): r is UnmuteRequestRecord => !!r && r.status === "pending")
                    .sort((a, b) => a.requestedAt - b.requestedAt)
                    .map((r) => ({
                        userId: r.userId,
                        status: "pending" as const,
                        requestedAt: r.requestedAt,
                    })),
            },
        };
    }

    async decideSessionMeetingUnmuteRequest(
        organizationId: string,
        sessionId: string,
        organizerUserId: string,
        targetUserId: string,
        decision: "approved" | "denied"
    ) {
        await this.assertOrganizerRole(organizationId, sessionId, organizerUserId);
        await this.getJoinContext(organizationId, sessionId, targetUserId);

        await this.config.kv.put(
            RTK_KEY_UNMUTE_REQ(organizationId, sessionId, targetUserId),
            JSON.stringify({
                userId: targetUserId,
                status: decision,
                requestedAt: Date.now(),
                decidedAt: Date.now(),
                decidedBy: organizerUserId,
            } satisfies UnmuteRequestRecord),
            { expirationTtl: RTK_KV_TTL_SEC }
        );
        if (decision === "approved") {
            await this.config.kv.put(RTK_KEY_MUTE(organizationId, sessionId, targetUserId), "0", {
                expirationTtl: RTK_KV_TTL_SEC,
            });
        }
        return { data: { userId: targetUserId, status: decision } };
    }

    /**
     * Returns a Realtime Kit participant token for the current user to join the session's meeting.
     */
    async issueSessionMeetingToken(organizationId: string, sessionId: string, userId: string) {
        const { session, role } = await this.getJoinContext(organizationId, sessionId, userId);
        if (role === "participant") {
            const wait = await this.config.kv.get<WaitingRecord>(
                RTK_KEY_WAIT(organizationId, sessionId, userId),
                "json"
            );
            if (wait?.status !== "approved") {
                throw new ForbiddenError("You have not been admitted to this meeting yet");
            }
        }

        const presetName =
            role === "organizer" ? this.config.presetOrganizer : this.config.presetParticipant;

        const meetingId = await this.getOrCreateMeeting(organizationId, sessionId, session.title);

        const token = await this.getOrCreateParticipantToken(
            meetingId,
            userId,
            presetName,
            role === "organizer" ? "Host" : "Participant"
        );

        return {
            data: {
                token,
                role,
                meetingId,
                appId: this.config.appId,
                sessionId: session.id,
            },
        };
    }

    private async getOrCreateMeeting(
        organizationId: string,
        sessionId: string,
        title: string
    ): Promise<string> {
        const { kv } = this.config;
        const key = RTK_KEY_MEET(organizationId, sessionId);
        const existing = await kv.get(key, "text");
        if (existing) return existing;

        const created = await this.cloudflareRequest<MeetingRow>("/meetings", {
            method: "POST",
            body: JSON.stringify({
                title: title || `Session ${sessionId}`,
                status: "ACTIVE",
            }),
        });
        if (!created.id) {
            throw new InternalServerError("Realtime meeting created without id");
        }
        await kv.put(key, created.id, { expirationTtl: RTK_KV_TTL_SEC });
        return created.id;
    }

    private async getOrCreateParticipantToken(
        meetingId: string,
        userId: string,
        presetName: string,
        displayName: string
    ): Promise<string> {
        const { kv } = this.config;
        const pKey = RTK_KEY_PART(meetingId, userId);
        const cachedPartId = await kv.get(pKey, "text");

        if (cachedPartId) {
            return this.refreshParticipantToken(meetingId, cachedPartId);
        }

        try {
            const created = await this.cloudflareRequest<ParticipantRow>(
                `/meetings/${meetingId}/participants`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        custom_participant_id: userId,
                        preset_name: presetName,
                        name: displayName,
                    }),
                }
            );
            if (!created.token) {
                throw new InternalServerError("Realtime participant created without token");
            }
            await kv.put(pKey, created.id, { expirationTtl: RTK_KV_TTL_SEC });
            return created.token;
        } catch (error) {
            const resolved = await this.findParticipantIdByCustomId(meetingId, userId);
            if (resolved) {
                await kv.put(pKey, resolved, { expirationTtl: RTK_KV_TTL_SEC });
                return this.refreshParticipantToken(meetingId, resolved);
            }
            throw error;
        }
    }

    private async findParticipantIdByCustomId(
        meetingId: string,
        customParticipantId: string
    ): Promise<string | null> {
        const list = await this.cloudflareRequest<ParticipantRow[]>(
            `/meetings/${meetingId}/participants`,
            { method: "GET" }
        );
        if (!Array.isArray(list)) {
            return null;
        }
        const found = list.find((p) => p.custom_participant_id === customParticipantId);
        return found?.id ?? null;
    }

    private async refreshParticipantToken(
        meetingId: string,
        participantId: string
    ): Promise<string> {
        const out = await this.cloudflareRequest<{ token: string }>(
            `/meetings/${meetingId}/participants/${participantId}/token`,
            { method: "POST" }
        );
        if (!out?.token) {
            throw new InternalServerError("Failed to refresh participant token");
        }
        return out.token;
    }
}
