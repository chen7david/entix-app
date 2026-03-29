import { useAdminCreateOrganization } from "@web/src/features/admin";
import { Alert, App, Button, Form, Input } from "antd";
import { useState } from "react";

export const CreateOrganizationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const { message } = App.useApp();
    const { mutateAsync: createOrganization, isPending: isCreating } = useAdminCreateOrganization();
    const [error, setError] = useState<string | null>(null);

    const onFinish = async (values: { name: string; slug: string }) => {
        setError(null);
        try {
            await createOrganization({ name: values.name, slug: values.slug });
            message.success("Organization created successfully");
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Failed to create organization");
        }
    };

    return (
        <div>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
            <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="Organization Name"
                    name="name"
                    rules={[{ required: true, message: "Please enter organization name" }]}
                >
                    <Input placeholder="Enter organization name" />
                </Form.Item>
                <Form.Item
                    label="Slug"
                    name="slug"
                    rules={[{ required: true, message: "Please enter organization slug" }]}
                >
                    <Input placeholder="enter-organization-slug" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isCreating} block>
                        Create Organization
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};
