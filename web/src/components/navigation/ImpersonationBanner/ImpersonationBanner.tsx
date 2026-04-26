import { UserOutlined } from "@ant-design/icons";
import { useStopImpersonating } from "@web/src/features/auth";
import { useSession } from "@web/src/lib/auth-client";
import { Alert, App, Button } from "antd";
import type React from "react";
import { createPortal } from "react-dom";

export const ImpersonationBanner: React.FC = () => {
    const { notification } = App.useApp();
    const { data, isPending: isSessionPending } = useSession();
    const { mutate: stopImpersonating, isPending: isStopping } = useStopImpersonating();

    // Better Auth injects `impersonatedBy` into the session object during impersonation
    const session = data?.session as any;

    if (isSessionPending || !session || !session.impersonatedBy) {
        return null; // Don't render if not impersonating
    }

    const handleStopImpersonation = () => {
        stopImpersonating(undefined, {
            onError: (error) => {
                notification.error({
                    message: "Stop Failed",
                    description: error.message || "Failed to stop impersonation",
                });
                console.error("Failed to stop impersonation", error);
            },
        });
    };

    const banner = (
        <div className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-auto md:left-[var(--app-sidebar-width)] z-[900] md:z-[1200] pointer-events-none">
            <Alert
                message={
                    <div className="flex justify-between items-center w-full px-2 py-1">
                        <div className="flex items-center gap-2 font-medium">
                            <UserOutlined />
                            <span>
                                You are currently impersonating{" "}
                                {data?.user?.name || data?.user?.email}
                            </span>
                        </div>
                        <Button
                            type="primary"
                            danger
                            size="small"
                            loading={isStopping}
                            onClick={handleStopImpersonation}
                            className="font-semibold pointer-events-auto"
                        >
                            Stop Impersonating
                        </Button>
                    </div>
                }
                type="warning"
                showIcon={false}
                banner
                className="border-b border-warning-border pointer-events-auto"
                style={{
                    backgroundColor: "rgba(254, 243, 199, 0.58)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                }}
            />
        </div>
    );

    if (typeof document === "undefined") {
        return banner;
    }

    return createPortal(banner, document.body);
};
