import { AppRoutes } from "@shared";
import {
    ResetPasswordForm,
    type ResetPasswordValues,
    useResetPassword,
    useSignIn,
} from "@web/src/features/auth";
import { App, Button, Card, Result, Typography } from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

const { Title, Text } = Typography;

export const ResetPasswordPage: React.FC = () => {
    const { notification } = App.useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const [status, setStatus] = useState<"idle" | "success" | "invalid">("idle");

    const { mutate: resetPassword, isPending } = useResetPassword();
    const { mutateAsync: signInUser } = useSignIn();

    useEffect(() => {
        if (!token) {
            setStatus("invalid");
        }
    }, [token]);

    const handleResetPassword = (values: ResetPasswordValues) => {
        if (!token) {
            notification.error({
                message: "Invalid Token",
                description: "The password reset token is missing or invalid.",
            });
            return;
        }

        resetPassword(
            {
                newPassword: values.newPassword,
                token,
            },
            {
                onSuccess: () => {
                    const finalize = async () => {
                        try {
                            if (!email) {
                                setStatus("success");
                                notification.success({
                                    message: "Password Reset",
                                    description:
                                        "Password reset complete. Redirecting to sign in...",
                                });
                                setTimeout(() => {
                                    navigate(AppRoutes.auth.signIn, { replace: true });
                                }, 3000);
                                return;
                            }

                            await signInUser({ email, password: values.newPassword });
                            setStatus("success");
                            notification.success({
                                message: "Password Reset",
                                description: "Password reset complete. You are now signed in.",
                            });
                            setTimeout(() => {
                                navigate("/", { replace: true });
                            }, 1200);
                        } catch (error) {
                            notification.warning({
                                message: "Password Reset Complete",
                                description:
                                    error instanceof Error
                                        ? `${error.message}. Please sign in manually.`
                                        : "Please sign in manually.",
                            });
                            setStatus("success");
                            setTimeout(() => {
                                navigate(AppRoutes.auth.signIn, { replace: true });
                            }, 2500);
                        }
                    };

                    void finalize();
                },
                onError: (error) => {
                    notification.error({
                        message: "Reset Failed",
                        description: error.message || "Failed to reset password",
                    });
                },
            }
        );
    };

    if (status === "invalid") {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                }}
            >
                <Result
                    status="error"
                    title="Invalid Reset Link"
                    subTitle="The password reset link is invalid or has expired."
                    extra={[
                        <Button
                            type="primary"
                            key="forgot"
                            onClick={() => navigate(AppRoutes.auth.forgotPassword)}
                        >
                            Request New Link
                        </Button>,
                        <Button key="signin" onClick={() => navigate(AppRoutes.auth.signIn)}>
                            Back to Sign In
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    if (status === "success") {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                }}
            >
                <Result
                    status="success"
                    title="Password Reset Successfully!"
                    subTitle="Redirecting you..."
                    extra={[
                        <Button
                            type="primary"
                            key="signin"
                            onClick={() =>
                                navigate(email ? "/" : AppRoutes.auth.signIn, { replace: true })
                            }
                        >
                            {email ? "Continue" : "Go to Sign In"}
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <Card style={{ width: 400, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Title level={2}>Reset Password</Title>
                <Text type="secondary">Enter your new password</Text>
            </div>
            <ResetPasswordForm onSubmit={handleResetPassword} isLoading={isPending} />
        </Card>
    );
};
