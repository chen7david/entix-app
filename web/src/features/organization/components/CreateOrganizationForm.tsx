import { useAdminCreateOrganization } from "@web/src/features/admin";
import { Alert, App, Button, Form, Input, Space } from "antd";
import { useState } from "react";

export const CreateOrganizationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const { notification } = App.useApp();
    const { mutateAsync: createOrganization, isPending: isCreating } = useAdminCreateOrganization();
    const [error, setError] = useState<string | null>(null);
    const [form] = Form.useForm();

    const onFinish = async (values: { name: string; slug: string }) => {
        setError(null);
        try {
            await createOrganization({ name: values.name, slug: values.slug });
            notification.success({
                message: "Organization Created",
                description: `Organization "${values.name}" created successfully.`,
            });
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Failed to create organization");
            notification.error({
                message: "Creation Failed",
                description: err.message || "Failed to create organization.",
            });
        }
    };

    return (
        <div>
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
            <Form form={form} layout="vertical" onFinish={onFinish}>
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
                    <Space.Compact block>
                        <Button type="primary" htmlType="submit" loading={isCreating}>
                            Create Organization
                        </Button>
                    </Space.Compact>
                </Form.Item>
            </Form>
        </div>
    );
};
