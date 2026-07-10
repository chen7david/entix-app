import { SignInForm, type SignInValues, useSignIn } from "@web/src/features/auth";
import { App, Card, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const SignInPage: React.FC = () => {
    const { notification } = App.useApp();

    const { mutate: signIn, isPending } = useSignIn();

    const handleSignIn = (values: SignInValues) => {
        signIn(
            {
                email: values.email,
                password: values.password,
            },
            {
                onSuccess: async () => {
                    notification.success({
                        message: "Sign In Successful",
                        description: "You have been signed in successfully.",
                    });
                },
                onError: (error: any) => {
                    notification.error({
                        message: "Sign In Failed",
                        description: error.message || "Failed to sign in",
                    });
                },
            }
        );
    };

    return (
        <Card style={{ width: 400, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Title level={2}>Welcome Back</Title>
                <Text type="secondary">Please sign in to continue</Text>
            </div>
            <SignInForm onSubmit={handleSignIn} isLoading={isPending} />
        </Card>
    );
};
