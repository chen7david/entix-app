import {
    AudioOutlined,
    CheckOutlined,
    CloseOutlined,
    CopyOutlined,
    LoadingOutlined,
    LockOutlined,
    PoweroffOutlined,
    TeamOutlined,
    UnlockOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import {
    RealtimeKitProvider,
    useRealtimeKitClient,
    useRealtimeKitMeeting,
} from "@cloudflare/realtimekit-react";
import { useMutation } from "@tanstack/react-query";
import { useOrganization } from "@web/src/features/organization";
import { getApiClient } from "@web/src/lib/api-client";
import { Alert, Avatar, Button, Drawer, Input, Spin, Typography } from "antd";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

const { Text } = Typography;

type MeetingTokenResponse = {
    data: {
        token: string;
        role: "organizer" | "participant";
        meetingId: string;
        appId: string;
        sessionId: string;
    };
};
type WaitingStatus = "not_requested" | "pending" | "approved" | "denied";
type MeetingRole = "organizer" | "participant";
type WaitingStatusResponse = { data: { status: WaitingStatus; role: MeetingRole } };
type WaitingPendingItem = {
    userId: string;
    status: "pending";
    role: "participant";
    requestedAt: number;
    displayName?: string | null;
    email?: string | null;
    image?: string | null;
};
type WaitingPendingResponse = { data: { items: WaitingPendingItem[] } };
type ParticipantRosterItem = {
    userId: string;
    participantId: string;
    name?: string | null;
    image?: string | null;
    isOrganizer: boolean;
    forceMuted: boolean;
};
type ParticipantRosterResponse = { data: { items: ParticipantRosterItem[] } };
type RoomStatusResponse = {
    data: { locked: boolean; participantCount: number; maxParticipants: number };
};
type UnmuteRequestItem = { userId: string; status: "pending"; requestedAt: number };
type UnmuteRequestListResponse = { data: { items: UnmuteRequestItem[] } };

function LocalVideoCanvas() {
    const { meeting } = useRealtimeKitMeeting();
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        meeting.self.registerVideoElement(videoEl, true);
        return () => {
            meeting.self.deregisterVideoElement(videoEl);
        };
    }, [meeting]);

    return (
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
    );
}

function MeetingControls({
    onLeave,
    forceMuted,
    unmuteRequestStatus,
    onRequestUnmute,
    onOpenPanel,
}: {
    onLeave: () => void;
    forceMuted: boolean;
    unmuteRequestStatus: "none" | "pending" | "approved" | "denied";
    onRequestUnmute: () => void;
    onOpenPanel: () => void;
}) {
    const { meeting } = useRealtimeKitMeeting();
    const [busy, setBusy] = useState(false);

    const toggleAudio = useCallback(async () => {
        if (forceMuted) return;
        setBusy(true);
        try {
            if (meeting.self.audioEnabled) await meeting.self.disableAudio();
            else await meeting.self.enableAudio();
        } finally {
            setBusy(false);
        }
    }, [meeting, forceMuted]);

    const toggleVideo = useCallback(async () => {
        setBusy(true);
        try {
            if (meeting.self.videoEnabled) await meeting.self.disableVideo();
            else await meeting.self.enableVideo();
        } finally {
            setBusy(false);
        }
    }, [meeting]);

    const leave = useCallback(async () => {
        setBusy(true);
        try {
            await onLeave();
        } finally {
            setBusy(false);
        }
    }, [onLeave]);

    return (
        <div className="mt-3 border-t border-white/20 pt-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                    icon={<AudioOutlined />}
                    size="large"
                    onClick={() => void toggleAudio()}
                    loading={busy}
                    type={meeting.self.audioEnabled ? "primary" : "default"}
                    disabled={forceMuted}
                >
                    {meeting.self.audioEnabled ? "Mute" : "Unmute"}
                </Button>
                {forceMuted ? (
                    <Button size="large" onClick={onRequestUnmute} disabled={busy}>
                        {unmuteRequestStatus === "pending" ? "Unmute requested" : "Request unmute"}
                    </Button>
                ) : null}
                <Button
                    icon={<VideoCameraOutlined />}
                    size="large"
                    onClick={() => void toggleVideo()}
                    loading={busy}
                    type={meeting.self.videoEnabled ? "primary" : "default"}
                >
                    {meeting.self.videoEnabled ? "Stop video" : "Start video"}
                </Button>
                <Button icon={<TeamOutlined />} size="large" onClick={onOpenPanel} disabled={busy}>
                    Controls
                </Button>
                <Button
                    danger
                    type="primary"
                    size="large"
                    icon={<PoweroffOutlined />}
                    onClick={() => void leave()}
                    loading={busy}
                >
                    Leave
                </Button>
            </div>
        </div>
    );
}

export const OrganizationSessionMeetingPage: React.FC = () => {
    const { sessionId, slug } = useParams<{ sessionId: string; slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { activeOrganization } = useOrganization();
    const [meeting, initMeeting] = useRealtimeKitClient({ resetOnLeave: true });
    const [phase, setPhase] = useState<"waiting" | "joining" | "ready" | "error">("waiting");
    const [waitingStatus, setWaitingStatus] = useState<WaitingStatus>("not_requested");
    const [meetingRole, setMeetingRole] = useState<MeetingRole>("participant");
    const [pendingList, setPendingList] = useState<WaitingPendingItem[]>([]);
    const [participantRoster, setParticipantRoster] = useState<ParticipantRosterItem[]>([]);
    const [roomStatus, setRoomStatus] = useState<RoomStatusResponse["data"]>({
        locked: false,
        participantCount: 0,
        maxParticipants: 25,
    });
    const [unmuteRequests, setUnmuteRequests] = useState<UnmuteRequestItem[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [selfForceMuted, setSelfForceMuted] = useState(false);
    const [selfUnmuteRequestStatus, setSelfUnmuteRequestStatus] = useState<
        "none" | "pending" | "approved" | "denied"
    >("none");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const meetingRef = useRef(meeting);
    meetingRef.current = meeting;

    const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const sessionTitle = query.get("title") || "Session meeting";
    const fallbackReturnTo = slug ? `/org/${slug}/dashboard` : "/";
    const returnTo = query.get("returnTo") || fallbackReturnTo;
    const inviteLink = `${window.location.origin}/org/${slug}/meeting/${sessionId}`;
    const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

    const copyInviteLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopyState("copied");
        } catch {
            setCopyState("error");
        } finally {
            window.setTimeout(() => setCopyState("idle"), 2000);
        }
    }, [inviteLink]);

    const issueToken = useMutation({
        mutationFn: async (): Promise<MeetingTokenResponse> => {
            if (!activeOrganization?.id || !sessionId) throw new Error("Missing session context");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].schedule[
                ":sessionId"
            ].meeting.token.$post({
                param: { organizationId: activeOrganization.id, sessionId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Failed to issue a meeting token");
            return data as MeetingTokenResponse;
        },
    });

    const fetchWaitingStatus = useCallback(async (): Promise<WaitingStatusResponse> => {
        if (!activeOrganization?.id || !sessionId) throw new Error("Missing session context");
        const api = getApiClient();
        const res = await api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting[
            "waiting-room"
        ].status.$get({
            param: { organizationId: activeOrganization.id, sessionId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to get waiting room status");
        return data as WaitingStatusResponse;
    }, [activeOrganization?.id, sessionId]);

    const requestAdmission = useCallback(async (): Promise<WaitingStatusResponse> => {
        if (!activeOrganization?.id || !sessionId) throw new Error("Missing session context");
        const api = getApiClient();
        const res = await api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting[
            "waiting-room"
        ].request.$post({
            param: { organizationId: activeOrganization.id, sessionId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to request admission");
        return data as WaitingStatusResponse;
    }, [activeOrganization?.id, sessionId]);

    const fetchPendingAdmissions = useCallback(async () => {
        if (!activeOrganization?.id || !sessionId) return;
        const api = getApiClient();
        const res = await api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting[
            "waiting-room"
        ].pending.$get({
            param: { organizationId: activeOrganization.id, sessionId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to load waiting room queue");
        const out = data as WaitingPendingResponse;
        setPendingList(out.data.items || []);
    }, [activeOrganization?.id, sessionId]);

    const decideAdmission = useCallback(
        async (targetUserId: string, decision: "approve" | "deny") => {
            if (!activeOrganization?.id || !sessionId) return;
            const api = getApiClient();
            const endpoint =
                api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting["waiting-room"][
                    ":targetUserId"
                ][decision];
            const res = await endpoint.$post({
                param: { organizationId: activeOrganization.id, sessionId, targetUserId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Failed waiting-room action");
            await fetchPendingAdmissions();
        },
        [activeOrganization?.id, sessionId, fetchPendingAdmissions]
    );

    const fetchParticipantRoster = useCallback(async () => {
        if (!activeOrganization?.id || !sessionId || meetingRole !== "organizer") return;
        const api = getApiClient();
        const res = await api.api.v1.orgs[":organizationId"].schedule[
            ":sessionId"
        ].meeting.participants.$get({
            param: { organizationId: activeOrganization.id, sessionId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to load participants");
        setParticipantRoster((data as ParticipantRosterResponse).data.items || []);
    }, [activeOrganization?.id, sessionId, meetingRole]);

    const fetchRoomStatus = useCallback(async () => {
        if (!activeOrganization?.id || !sessionId) return;
        const api = getApiClient();
        const res = await api.api.v1.orgs[":organizationId"].schedule[
            ":sessionId"
        ].meeting.room.$get({
            param: { organizationId: activeOrganization.id, sessionId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to load room status");
        setRoomStatus((data as RoomStatusResponse).data);
    }, [activeOrganization?.id, sessionId]);

    const setRoomLock = useCallback(
        async (locked: boolean) => {
            if (!activeOrganization?.id || !sessionId) return;
            const api = getApiClient();
            const endpoint = locked
                ? api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting.room.lock
                : api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting.room.unlock;
            const res = await endpoint.$post({
                param: { organizationId: activeOrganization.id, sessionId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Failed to update room lock");
            await fetchRoomStatus();
        },
        [activeOrganization?.id, sessionId, fetchRoomStatus]
    );

    const moderateParticipant = useCallback(
        async (targetUserId: string, action: "mute" | "unmute" | "remove") => {
            if (!activeOrganization?.id || !sessionId) return;
            const api = getApiClient();
            const endpoint =
                api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting.participants[
                    ":targetUserId"
                ][action];
            const res = await endpoint.$post({
                param: { organizationId: activeOrganization.id, sessionId, targetUserId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Moderation action failed");
            await fetchParticipantRoster();
        },
        [activeOrganization?.id, sessionId, fetchParticipantRoster]
    );

    const fetchUnmuteRequests = useCallback(async () => {
        if (!activeOrganization?.id || !sessionId || meetingRole !== "organizer") return;
        const api = getApiClient();
        const res = await api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting[
            "unmute-requests"
        ].$get({
            param: { organizationId: activeOrganization.id, sessionId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to load unmute requests");
        setUnmuteRequests((data as UnmuteRequestListResponse).data.items || []);
    }, [activeOrganization?.id, sessionId, meetingRole]);

    const decideUnmuteRequest = useCallback(
        async (targetUserId: string, decision: "approve" | "deny") => {
            if (!activeOrganization?.id || !sessionId) return;
            const api = getApiClient();
            const endpoint =
                api.api.v1.orgs[":organizationId"].schedule[":sessionId"].meeting[
                    "unmute-requests"
                ][":targetUserId"][decision];
            const res = await endpoint.$post({
                param: { organizationId: activeOrganization.id, sessionId, targetUserId },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Failed unmute decision");
            await fetchUnmuteRequests();
            await fetchParticipantRoster();
        },
        [activeOrganization?.id, sessionId, fetchUnmuteRequests, fetchParticipantRoster]
    );

    const requestUnmuteForSelf = useCallback(async () => {
        if (!activeOrganization?.id || !sessionId) return;
        const api = getApiClient();
        const res = await api.api.v1.orgs[":organizationId"].schedule[
            ":sessionId"
        ].meeting.participants.self["unmute-request"].$post({
            param: { organizationId: activeOrganization.id, sessionId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Failed to request unmute");
        setSelfUnmuteRequestStatus("pending");
    }, [activeOrganization?.id, sessionId]);

    const shutdownMeeting = useCallback(async () => {
        const activeMeeting = meetingRef.current;
        if (!activeMeeting) return;
        try {
            if (activeMeeting.self.videoEnabled) await activeMeeting.self.disableVideo();
            if (activeMeeting.self.audioEnabled) await activeMeeting.self.disableAudio();
        } catch {
            // best effort before leave
        }
        try {
            await activeMeeting.leaveRoom();
        } catch {
            // already left
        }
    }, []);

    const leaveMeetingPage = useCallback(async () => {
        await shutdownMeeting();
        if (window.opener) {
            window.close();
            return;
        }
        navigate(returnTo, { replace: true });
    }, [navigate, returnTo, shutdownMeeting]);

    const joinMeeting = useCallback(async () => {
        if (!activeOrganization?.id || !sessionId) return;
        setErrorMessage(null);
        try {
            const req = await requestAdmission();
            setMeetingRole(req.data.role);
            setWaitingStatus(req.data.status);
            if (req.data.status !== "approved") {
                setPhase("waiting");
                return;
            }

            setPhase("joining");
            const tokenRes = await issueToken.mutateAsync();
            const client = await initMeeting({
                authToken: tokenRes.data.token,
                defaults: { audio: false, video: true },
            });
            if (!client) {
                setPhase("error");
                setErrorMessage("Could not initialize meeting");
                return;
            }
            await client.joinRoom();
            setPhase("ready");
        } catch (e) {
            setPhase("error");
            setErrorMessage(e instanceof Error ? e.message : "Could not join the room");
        }
    }, [activeOrganization?.id, sessionId, requestAdmission, initMeeting, issueToken.mutateAsync]);

    useEffect(() => {
        return () => {
            void shutdownMeeting();
        };
    }, [shutdownMeeting]);

    useEffect(() => {
        const handlePageExit = () => {
            void shutdownMeeting();
        };
        window.addEventListener("pagehide", handlePageExit);
        window.addEventListener("beforeunload", handlePageExit);
        return () => {
            window.removeEventListener("pagehide", handlePageExit);
            window.removeEventListener("beforeunload", handlePageExit);
        };
    }, [shutdownMeeting]);

    useEffect(() => {
        if (meetingRole !== "participant" || waitingStatus !== "pending" || phase === "ready")
            return;
        const timer = window.setInterval(async () => {
            try {
                const status = await fetchWaitingStatus();
                setWaitingStatus(status.data.status);
                if (status.data.status === "approved") {
                    setMeetingRole(status.data.role);
                    await joinMeeting();
                }
                if (status.data.status === "denied") {
                    setPhase("error");
                    setErrorMessage("Your join request was denied by the host");
                    window.clearInterval(timer);
                }
            } catch {
                // keep polling; temporary API issues should self-heal
            }
        }, 3000);
        return () => window.clearInterval(timer);
    }, [meetingRole, waitingStatus, phase, fetchWaitingStatus, joinMeeting]);

    useEffect(() => {
        if (phase !== "ready" || meetingRole !== "organizer") return;
        void fetchPendingAdmissions();
        void fetchParticipantRoster();
        void fetchRoomStatus();
        void fetchUnmuteRequests();
        const timer = window.setInterval(() => {
            void fetchPendingAdmissions();
            void fetchParticipantRoster();
            void fetchRoomStatus();
            void fetchUnmuteRequests();
        }, 5000);
        return () => window.clearInterval(timer);
    }, [
        phase,
        meetingRole,
        fetchPendingAdmissions,
        fetchParticipantRoster,
        fetchRoomStatus,
        fetchUnmuteRequests,
    ]);

    useEffect(() => {
        if (phase !== "ready" || meetingRole !== "participant") return;
        const timer = window.setInterval(async () => {
            if (!activeOrganization?.id || !sessionId || !meetingRef.current) return;
            try {
                const api = getApiClient();
                const res = await api.api.v1.orgs[":organizationId"].schedule[
                    ":sessionId"
                ].meeting.participants.self["mute-status"].$get({
                    param: { organizationId: activeOrganization.id, sessionId },
                });
                const data = await res.json();
                if (!res.ok) return;
                setSelfForceMuted(!!data.data.forceMuted);
                if (data.data.forceMuted && meetingRef.current.self.audioEnabled) {
                    await meetingRef.current.self.disableAudio();
                }
                const reqRes = await api.api.v1.orgs[":organizationId"].schedule[
                    ":sessionId"
                ].meeting.participants.self["unmute-request"].status.$get({
                    param: { organizationId: activeOrganization.id, sessionId },
                });
                const reqData = await reqRes.json();
                if (reqRes.ok) setSelfUnmuteRequestStatus(reqData.data.status);
            } catch {
                // best effort polling
            }
        }, 3000);
        return () => window.clearInterval(timer);
    }, [phase, meetingRole, activeOrganization?.id, sessionId]);

    return (
        <div className="h-dvh w-full bg-black text-white">
            <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Text style={{ color: "white", fontSize: 16 }}>{sessionTitle}</Text>
                    {phase === "ready" ? (
                        <Text style={{ color: "rgba(255,255,255,0.7)" }}>Live</Text>
                    ) : null}
                </div>
                {phase === "waiting" && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        {waitingStatus === "pending" ? (
                            <>
                                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                                    Waiting room - your request is pending host approval
                                </Text>
                                <Text style={{ color: "rgba(255,255,255,0.65)" }}>
                                    Keep this page open. You will enter automatically when approved.
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                                    Waiting room - join when you are ready
                                </Text>
                                <Button type="primary" onClick={() => void joinMeeting()}>
                                    Enter meeting
                                </Button>
                            </>
                        )}
                    </div>
                )}
                {phase === "joining" && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <Spin indicator={<LoadingOutlined spin style={{ color: "white" }} />} />
                        <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                            Connecting to video...
                        </Text>
                    </div>
                )}
                {phase === "error" && errorMessage && (
                    <Alert type="error" showIcon message={errorMessage} />
                )}
                <RealtimeKitProvider value={meeting} fallback={null}>
                    {meeting && phase === "ready" ? (
                        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/20 bg-black p-2">
                            <div className="h-full min-h-0 overflow-hidden rounded-md bg-black">
                                <LocalVideoCanvas />
                            </div>
                            <MeetingControls
                                onLeave={leaveMeetingPage}
                                forceMuted={selfForceMuted}
                                unmuteRequestStatus={selfUnmuteRequestStatus}
                                onRequestUnmute={() => void requestUnmuteForSelf()}
                                onOpenPanel={() => setPanelOpen(true)}
                            />
                        </div>
                    ) : null}
                </RealtimeKitProvider>
            </div>
            <Drawer
                title="Meeting controls"
                placement="right"
                width={420}
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
            >
                <div className="flex flex-col gap-3">
                    <Text type="secondary">Invite link</Text>
                    <Input value={inviteLink} readOnly />
                    <Button icon={<CopyOutlined />} onClick={() => void copyInviteLink()}>
                        {copyState === "copied"
                            ? "Copied"
                            : copyState === "error"
                              ? "Copy failed"
                              : "Copy invite link"}
                    </Button>
                    <div className="rounded border p-3">
                        <Text>
                            Room status: {roomStatus.participantCount}/{roomStatus.maxParticipants}{" "}
                            · {roomStatus.locked ? "Locked" : "Open"}
                        </Text>
                        {meetingRole === "organizer" ? (
                            <div className="mt-2">
                                <Button
                                    size="small"
                                    icon={roomStatus.locked ? <UnlockOutlined /> : <LockOutlined />}
                                    onClick={() => void setRoomLock(!roomStatus.locked)}
                                >
                                    {roomStatus.locked ? "Unlock room" : "Lock room"}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                    {meetingRole === "organizer" ? (
                        <>
                            <div className="rounded border p-3">
                                <Text>Waiting room ({pendingList.length})</Text>
                                <div className="mt-2 flex max-h-48 flex-col gap-2 overflow-auto">
                                    {pendingList.length === 0 ? (
                                        <Text type="secondary">No pending join requests</Text>
                                    ) : (
                                        pendingList.map((item) => (
                                            <div
                                                key={item.userId}
                                                className="flex items-center justify-between rounded border p-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Avatar
                                                        size="small"
                                                        src={item.image ?? undefined}
                                                    >
                                                        {item.displayName?.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Text>{item.displayName || item.userId}</Text>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="small"
                                                        icon={<CheckOutlined />}
                                                        onClick={() =>
                                                            void decideAdmission(
                                                                item.userId,
                                                                "approve"
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        size="small"
                                                        danger
                                                        icon={<CloseOutlined />}
                                                        onClick={() =>
                                                            void decideAdmission(
                                                                item.userId,
                                                                "deny"
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="rounded border p-3">
                                <Text>Participants ({participantRoster.length})</Text>
                                <div className="mt-2 flex max-h-48 flex-col gap-2 overflow-auto">
                                    {participantRoster.length === 0 ? (
                                        <Text type="secondary">No participants in room</Text>
                                    ) : (
                                        participantRoster.map((item) => (
                                            <div
                                                key={item.userId}
                                                className="flex items-center justify-between rounded border p-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Avatar
                                                        size="small"
                                                        src={item.image ?? undefined}
                                                    >
                                                        {item.name?.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Text>{item.name || item.userId}</Text>
                                                </div>
                                                {item.isOrganizer ? null : (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="small"
                                                            onClick={() =>
                                                                void moderateParticipant(
                                                                    item.userId,
                                                                    item.forceMuted
                                                                        ? "unmute"
                                                                        : "mute"
                                                                )
                                                            }
                                                        >
                                                            {item.forceMuted ? "Unmute" : "Mute"}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            danger
                                                            onClick={() =>
                                                                void moderateParticipant(
                                                                    item.userId,
                                                                    "remove"
                                                                )
                                                            }
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="rounded border p-3">
                                <Text>Unmute requests ({unmuteRequests.length})</Text>
                                <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-auto">
                                    {unmuteRequests.length === 0 ? (
                                        <Text type="secondary">No pending unmute requests</Text>
                                    ) : (
                                        unmuteRequests.map((item) => (
                                            <div
                                                key={item.userId}
                                                className="flex items-center justify-between rounded border p-2"
                                            >
                                                <Text>{item.userId}</Text>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="small"
                                                        icon={<CheckOutlined />}
                                                        onClick={() =>
                                                            void decideUnmuteRequest(
                                                                item.userId,
                                                                "approve"
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        size="small"
                                                        danger
                                                        icon={<CloseOutlined />}
                                                        onClick={() =>
                                                            void decideUnmuteRequest(
                                                                item.userId,
                                                                "deny"
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </Drawer>
        </div>
    );
};
