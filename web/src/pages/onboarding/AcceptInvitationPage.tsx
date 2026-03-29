import { useAuth } from "@web/src/features/auth";
import { useInvitations, useOrganization } from "@web/src/features/organization";
import { App, Button, Card, Result, Spin } from "antd";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

export const AcceptInvitationPage: React.FC = () => {
    const { message } = App.useApp();
    const [searchParams] = useSearchParams();
    const invitationId = searchParams.get("id");
    const { checkOrganizationStatus } = useOrganization();
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
                        message.success("Invitation accepted successfully!");
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
        message.success,
    ]);

    const handleGoToDashboard = () => {
        // Check status to determine best redirection (likely the new org)
        checkOrganizationStatus();
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
