import { AudioOutlined, VideoCameraOutlined } from "@ant-design/icons";
import {
    RealtimeKitProvider,
    useRealtimeKitClient,
    useRealtimeKitMeeting,
} from "@cloudflare/realtimekit-react";
import { Alert, App, Button, Modal, Space, Spin, Typography } from "antd";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const { Text } = Typography;

type SessionVideoMeetingModalProps = {
    open: boolean;
    /** Participant auth token from the Worker (Realtime Kit). */
    authToken: string | null;
    sessionTitle: string;
    onClose: () => void;
};

function LocalVideoPreview() {
    const { meeting } = useRealtimeKitMeeting();
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!meeting || !videoEl) return;

        meeting.self.registerVideoElement(videoEl, true);
        return () => {
            meeting.self.deregisterVideoElement(videoEl);
        };
    }, [meeting]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full bg-black object-cover"
        />
    );
}

function MeetingToolbar({ onLeave }: { onLeave: () => void }) {
    const { meeting } = useRealtimeKitMeeting();
    const { notification } = App.useApp();
    const [busy, setBusy] = useState(false);

    const toggleAudio = useCallback(async () => {
        setBusy(true);
        try {
            if (meeting.self.audioEnabled) {
                await meeting.self.disableAudio();
            } else {
                await meeting.self.enableAudio();
            }
        } catch (e) {
            notification.error({
                message: "Microphone",
                description: e instanceof Error ? e.message : "Could not toggle microphone",
            });
        } finally {
            setBusy(false);
        }
    }, [meeting, notification]);

    const toggleVideo = useCallback(async () => {
        setBusy(true);
        try {
            if (meeting.self.videoEnabled) {
                await meeting.self.disableVideo();
            } else {
                await meeting.self.enableVideo();
            }
        } catch (e) {
            notification.error({
                message: "Camera",
                description: e instanceof Error ? e.message : "Could not toggle camera",
            });
        } finally {
            setBusy(false);
        }
    }, [meeting, notification]);

    const leave = useCallback(async () => {
        setBusy(true);
        try {
            await meeting.leaveRoom();
        } finally {
            setBusy(false);
            onLeave();
        }
    }, [meeting, onLeave]);

    return (
        <Space wrap className="w-full justify-between">
            <Text type="secondary">You are in the session video room.</Text>
            <Space wrap>
                <Button
                    icon={<AudioOutlined />}
                    onClick={() => void toggleAudio()}
                    loading={busy}
                    type={meeting.self.audioEnabled ? "primary" : "default"}
                >
                    {meeting.self.audioEnabled ? "Mute" : "Unmute"}
                </Button>
                <Button
                    icon={<VideoCameraOutlined />}
                    onClick={() => void toggleVideo()}
                    loading={busy}
                    type={meeting.self.videoEnabled ? "primary" : "default"}
                >
                    {meeting.self.videoEnabled ? "Stop video" : "Start video"}
                </Button>
                <Button danger onClick={() => void leave()} loading={busy}>
                    Leave
                </Button>
            </Space>
        </Space>
    );
}

export const SessionVideoMeetingModal: React.FC<SessionVideoMeetingModalProps> = ({
    open,
    authToken,
    sessionTitle,
    onClose,
}) => {
    const [meeting, initMeeting] = useRealtimeKitClient({ resetOnLeave: true });
    const [phase, setPhase] = useState<"idle" | "joining" | "ready" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const meetingRef = useRef(meeting);
    meetingRef.current = meeting;

    useEffect(() => {
        if (!open || !authToken) {
            setPhase("idle");
            setErrorMessage(null);
            return;
        }

        setPhase("joining");
        setErrorMessage(null);
        let cancelled = false;

        (async () => {
            try {
                const client = await initMeeting({
                    authToken,
                    defaults: { audio: false, video: false },
                });
                if (cancelled || !client) return;
                await client.joinRoom();
                if (!cancelled) setPhase("ready");
            } catch (e) {
                if (!cancelled) {
                    setPhase("error");
                    setErrorMessage(e instanceof Error ? e.message : "Could not join the room");
                }
            }
        })();

        return () => {
            cancelled = true;
            void meetingRef.current?.leaveRoom?.();
        };
    }, [open, authToken, initMeeting]);

    const handleModalClose = () => {
        void meetingRef.current?.leaveRoom?.();
        onClose();
    };

    return (
        <Modal
            title={`Video — ${sessionTitle}`}
            open={open}
            onCancel={handleModalClose}
            footer={null}
            destroyOnClose
            width="100vw"
            maskClosable={false}
            style={{ top: 0, paddingBottom: 0, maxWidth: "100vw" }}
            styles={{
                body: {
                    height: "calc(100vh - 56px)",
                    padding: 16,
                },
            }}
        >
            <div className="flex flex-col gap-4 min-h-[200px]">
                {phase === "joining" && (
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                        <Spin size="large" />
                        <Text type="secondary">Connecting to video…</Text>
                    </div>
                )}
                {phase === "error" && errorMessage && (
                    <Alert type="error" message={errorMessage} showIcon />
                )}
                <RealtimeKitProvider value={meeting} fallback={null}>
                    {meeting && phase === "ready" ? (
                        <div className="flex flex-col gap-4 h-full min-h-[calc(100vh-180px)]">
                            <div className="flex-1 min-h-[420px] rounded-md overflow-hidden bg-black">
                                <LocalVideoPreview />
                            </div>
                            <MeetingToolbar onLeave={handleModalClose} />
                        </div>
                    ) : null}
                </RealtimeKitProvider>
            </div>
        </Modal>
    );
};
