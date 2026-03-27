import { AppRoutes } from "@shared/constants/routes";
import { useAuth } from "@web/src/hooks/auth/useAuth";
import { useInvitations } from "@web/src/hooks/auth/useInvitations";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { App, Button, Card, Result, Spin } from "antd";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export const AcceptInvitationPage: React.FC = () => {
    const { message } = App.useApp();
    const [searchParams] = useSearchParams();
    const invitationId = searchParams.get("id");
    const navigate = useNavigate();
    const { checkOrganizationStatus } = useOrganization();
    const { acceptInvitation, isAcceptingInvitation } = useInvitations();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const hasAcceptedRef = useRef(false);

    useEffect(() => {
        if (isAuthLoading) return;

        if (!invitationId) {
            setError("Invalid invitation link");
            return;
        }

        if (!isAuthenticated) {
            // Redirect to sign in and preserve return URL
            navigate(
                `${AppRoutes.auth.signIn}?returnUrl=${encodeURIComponent(`/auth/accept-invitation?id=${invitationId}`)}`
            );
            return;
        }

        // Auto-accept if authenticated and not already processed
        if (!success && !error && !isAcceptingInvitation && !hasAcceptedRef.current) {
            hasAcceptedRef.current = true; // Mark as accepted immediately to prevent double-invocation
            acceptInvitation(invitationId)
                .then((result) => {
                    if (result.error) {
                        setError(result.error.message || "Failed to accept invitation");
                    } else {
                        setSuccess(true);
                        message.success("Invitation accepted successfully!");
                    }
                })
                .catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : "An unexpected error occurred");
                });
        }
    }, [
        invitationId,
        isAuthenticated,
        isAuthLoading,
        acceptInvitation,
        navigate,
        success,
        error,
        isAcceptingInvitation,
        message.success,
    ]);

    const handleGoToDashboard = () => {
        // Check status to determine best redirection (likely the new org)
        checkOrganizationStatus();
    };

    if (isAuthLoading || (isAuthenticated && isAcceptingInvitation && !success && !error)) {
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
                        <Button
                            type="primary"
                            key="dashboard"
                            onClick={() => checkOrganizationStatus()}
                        >
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
                        <Button type="primary" key="dashboard" onClick={handleGoToDashboard}>
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
