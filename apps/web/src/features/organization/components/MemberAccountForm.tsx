import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { Alert, App, Button, Form, Input, Space, Switch, Typography } from "antd";
import { useEffect } from "react";

const { Text } = Typography;

type Props = {
    organizationId: string;
    userId: string;
    currentEmail: string;
    emailVerified?: boolean;
    canUpdate: boolean;
};

type UpdateAccountResult = {
    data: {
        userId: string;
        email: string;
        emailVerified: boolean;
        verificationEmailQueued: boolean;
    };
};

export const MemberAccountForm = ({
    organizationId,
    userId,
    currentEmail,
    emailVerified,
    canUpdate,
}: Props) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    useEffect(() => {
        form.setFieldsValue({
            email: currentEmail,
            sendVerification: true,
        });
    }, [currentEmail, form]);

    const updateAccount = useMutation({
        mutationFn: async (values: { email: string; sendVerification: boolean }) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].members[":userId"].account.$patch({
                param: { organizationId, userId },
                json: {
                    email: values.email.trim().toLowerCase(),
                    sendVerification: values.sendVerification,
                },
            });
            return hcJson<UpdateAccountResult>(res);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
            const queued = result.data.verificationEmailQueued;
            notification.success({
                message: "Account updated",
                description: queued
                    ? `Email set to ${result.data.email}. A verification email was sent. Existing sessions were revoked.`
                    : `Email set to ${result.data.email}. Existing sessions were revoked.`,
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Update failed",
                description: error.message || "Could not update account email.",
            });
        },
    });

    return (
        <Form
            form={form}
            layout="vertical"
            disabled={!canUpdate}
            onFinish={(values) => updateAccount.mutate(values)}
            initialValues={{ email: currentEmail, sendVerification: true }}
        >
            <Alert
                type="info"
                showIcon
                className="mb-4"
                message="Login email"
                description="Updating the email applies immediately, marks the account unverified, and revokes active sessions. Prefer correcting typos or lost-access addresses here — the member must verify the new address before signing in (when verification is required)."
            />

            <Form.Item label="Current status">
                <Text type="secondary">
                    {emailVerified ? "Verified" : "Unverified"} · {currentEmail}
                </Text>
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: "Email is required" },
                    { type: "email", message: "Enter a valid email" },
                ]}
            >
                <Input placeholder="member@example.com" autoComplete="off" />
            </Form.Item>

            <Form.Item
                name="sendVerification"
                label="Send verification email"
                valuePropName="checked"
            >
                <Switch />
            </Form.Item>

            <Form.Item className="mb-0 pt-2">
                <Space>
                    <Button type="primary" htmlType="submit" loading={updateAccount.isPending}>
                        Save email
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};
