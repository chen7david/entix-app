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
                        message: "Signed in",
                        description: "Welcome back.",
                    });
                },
                onError: (error: any) => {
                    notification.error({
                        message: "Sign in failed",
                        description: error.message || "Failed to sign in",
                    });
                },
            }
        );
    };

    return (
        <Card className="w-full border-0 shadow-md" styles={{ body: { padding: 32 } }}>
            <div className="text-center mb-7">
                <Title level={2} className="!mb-2 font-display tracking-tight">
                    Sign in
                </Title>
                <Text type="secondary">Access your academy workspace</Text>
            </div>
            <SignInForm onSubmit={handleSignIn} isLoading={isPending} />
        </Card>
    );
};
