import { AppRoutes } from "@shared";
import { useVerifyEmail } from "@web/src/features/auth";
import { App, Button, Card, Result, Spin, Typography } from "antd";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

const { Text } = Typography;

export const VerifyEmailPage: React.FC = () => {
    const { notification } = App.useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"verifying" | "success" | "error">(
        token ? "verifying" : "error"
    );

    const { mutate: verify } = useVerifyEmail();

    const handleNavigateResult = useCallback(() => {
        navigate("/", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (!token) {
            return;
        }

        verify(
            {
                query: {
                    token,
                },
            },
            {
                onSuccess: (response: any) => {
                    const data = response.data as { status?: boolean } | null;
                    if (data?.status) {
                        notification.success({
                            message: "Email Verified",
                            description: "Your email has been verified successfully!",
                        });
                        // Check org status to redirect appropriately
                        handleNavigateResult();
                    } else {
                        setStatus("success");
                        setTimeout(() => {
                            navigate(AppRoutes.auth.signIn);
                        }, 3000);
                    }
                },
                onError: () => {
                    setStatus("error");
                },
            }
        );
    }, [token, verify, notification, handleNavigateResult, navigate]);

    if (status === "verifying") {
        return (
            <Card style={{ width: 400, margin: "0 auto" }}>
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 24 }}>
                        <Text>Verifying your email...</Text>
                    </div>
                </div>
            </Card>
        );
    }

    if (status === "success") {
        return (
            <Card style={{ width: 400, margin: "0 auto" }}>
                <Result
                    status="success"
                    title="Email Verified Successfully!"
                    subTitle="Redirecting you..."
                    extra={[
                        <Button type="primary" key="dashboard" onClick={handleNavigateResult} block>
                            Continue
                        </Button>,
                    ]}
                    style={{ padding: "0 0 24px 0" }}
                />
            </Card>
        );
    }

    return (
        <Card style={{ width: 400, margin: "0 auto" }}>
            <Result
                status="error"
                title="Verification Failed"
                subTitle="The verification link is invalid or has expired."
                extra={[
                    <Button
                        type="primary"
                        key="signin"
                        onClick={() => navigate(AppRoutes.auth.signIn)}
                        block
                    >
                        Go to Sign In
                    </Button>,
                ]}
                style={{ padding: "0 0 24px 0" }}
            />
        </Card>
    );
};
