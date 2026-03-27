import { SignInForm, type SignInValues } from "@web/src/components/auth/SignInForm";
import { useSignIn } from "@web/src/hooks/auth/useAuth";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { App, Card, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const SignInPage: React.FC = () => {
    const { message } = App.useApp();

    const { mutate: signIn, isPending } = useSignIn();
    const { checkOrganizationStatus } = useOrganization();

    const handleSignIn = (values: SignInValues) => {
        signIn(
            {
                email: values.email,
                password: values.password,
            },
            {
                onSuccess: async () => {
                    message.success("Signed in successfully!");
                    await checkOrganizationStatus();
                },
                onError: (error) => {
                    message.error(error.message || "Failed to sign in");
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
