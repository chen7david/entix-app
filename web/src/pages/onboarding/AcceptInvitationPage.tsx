import { useAuth } from "@web/src/features/auth";
import { useInvitations } from "@web/src/features/organization";
import { App, Button, Card, Result, Spin } from "antd";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export const AcceptInvitationPage: React.FC = () => {
    const { notification } = App.useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const invitationId = searchParams.get("id");
    const { acceptInvitation, isAcceptingInvitation } = useInvitations();
    const { isLoading: isAuthLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const hasAcceptedRef = useRef(false);

    useEffect(() => {
        if (isAuthLoading) return;

        if (!invitationId) {
            setError("Invalid invitation link");
            return;
        }

        // Auto-accept if authenticated (ProtectedRoute ensures we are) and not already processed
        if (!success && !error && !isAcceptingInvitation && !hasAcceptedRef.current) {
            hasAcceptedRef.current = true; // Mark as accepted immediately to prevent double-invocation
            acceptInvitation(invitationId)
                .then((result) => {
                    if (result.error) {
                        setError(result.error.message || "Failed to accept invitation");
                    } else {
                        setSuccess(true);
                        notification.success({
                            message: "Invitation Accepted",
                            description: "You have successfully joined the organization.",
                        });
                    }
                })
                .catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : "An unexpected error occurred");
                });
        }
    }, [
        invitationId,
        isAuthLoading,
        acceptInvitation,
        success,
        error,
        isAcceptingInvitation,
        notification,
    ]);

    const handleNavigateResult = () => {
        navigate("/", { replace: true });
    };

    if (isAuthLoading || (isAcceptingInvitation && !success && !error)) {
        return <Spin size="large" tip="Accepting invitation..." />;
    }

    return (
        <Card className="w-full max-w-md shadow-lg">
            {error ? (
                <Result
                    status="error"
                    title="Invitation Failed"
                    subTitle={error}
                    extra={[
                        <Button type="primary" key="dashboard" onClick={handleNavigateResult}>
                            Go to Dashboard
                        </Button>,
                    ]}
                />
            ) : success ? (
                <Result
                    status="success"
                    title="Invitation Accepted!"
                    subTitle="You have successfully joined the organization."
                    extra={[
                        <Button type="primary" key="dashboard" onClick={handleNavigateResult}>
                            Go to Dashboard
                        </Button>,
                    ]}
                />
            ) : (
                <div className="text-center">
                    <Spin size="large" />
                    <div className="mt-4">Processing invitation...</div>
                </div>
            )}
        </Card>
    );
};
