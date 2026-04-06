import { AppRoutes } from "@shared";
import {
    SignUpWithOrgForm,
    type SignUpWithOrgValues,
    useSignUpWithOrg,
} from "@web/src/features/auth";
import { App, Card, Typography } from "antd";
import type React from "react";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;

export const SignUpPage: React.FC = () => {
    const { notification } = App.useApp();
    const navigate = useNavigate();
    const { mutate: signUp, isPending } = useSignUpWithOrg();

    const handleSignUp = (values: SignUpWithOrgValues) => {
        signUp(
            {
                email: values.email,
                password: values.password,
                name: values.name,
                organizationName: values.organizationName,
            },
            {
                onSuccess: () => {
                    notification.success({
                        message: "Account Created!",
                        description: "Your account and organization were created successfully.",
                    });
                    // Navigate to dashboard or email verification depending on flow
                    // For now, let's assume dashboard or email verification
                    navigate(AppRoutes.auth.emailVerificationPending, {
                        state: { email: values.email },
                    });
                },
                onError: (error) => {
                    notification.error({
                        message: "Sign Up Failed",
                        description: error.message || "Failed to create account",
                    });
                },
            }
        );
    };

    return (
        <Card style={{ width: 400, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Title level={2}>Sign Up</Title>
                <Text type="secondary">Create your account to get started</Text>
            </div>
            <SignUpWithOrgForm onSubmit={handleSignUp} isLoading={isPending} />
        </Card>
    );
};
