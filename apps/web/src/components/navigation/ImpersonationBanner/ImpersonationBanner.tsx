import { SwapOutlined, UserOutlined } from "@ant-design/icons";
import { useStopImpersonating } from "@web/src/features/auth";
import { useSession } from "@web/src/lib/auth-client";
import { App, Button, theme } from "antd";
import type React from "react";
import { createPortal } from "react-dom";

export const ImpersonationBanner: React.FC = () => {
    const { token } = theme.useToken();
    const { notification } = App.useApp();
    const { data, isPending: isSessionPending } = useSession();
    const { mutate: stopImpersonating, isPending: isStopping } = useStopImpersonating();

    const session = data?.session as any;

    if (isSessionPending || !session || !session.impersonatedBy) {
        return null;
    }

    const handleStopImpersonation = () => {
        stopImpersonating(undefined, {
            onError: (error) => {
                notification.error({
                    message: "Stop Failed",
                    description: error.message || "Failed to stop impersonation",
                });
            },
        });
    };

    const banner = (
        <div className="fixed bottom-14 md:bottom-auto md:top-0 left-0 right-0 md:left-[var(--app-sidebar-width)] z-[900] md:z-[1200]">
            <div
                className="flex justify-between items-center w-full px-4 py-2"
                style={{
                    backgroundColor: token.colorWarning,
                    color: token.colorTextLightSolid,
                }}
            >
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <UserOutlined />
                    <span>
                        Impersonating: <strong>{data?.user?.name || data?.user?.email}</strong>
                    </span>
                </div>
                <Button
                    size="small"
                    loading={isStopping}
                    onClick={handleStopImpersonation}
                    icon={<SwapOutlined />}
                    style={{
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderColor: "rgba(255,255,255,0.4)",
                        color: token.colorTextLightSolid,
                        fontWeight: 600,
                    }}
                >
                    Stop Impersonating
                </Button>
            </div>
        </div>
    );

    if (typeof document === "undefined") return banner;
    return createPortal(banner, document.body);
};
