import { useState } from "react";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Button, Form, Input, Alert } from "antd";


export const CreateOrganizationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const { createOrganization } = useOrganization();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFinish = async (values: { name: string; slug: string }) => {
        setLoading(true);
        setError(null);
        const { error } = await createOrganization(values.name, values.slug);
        if (error) {
            setError(error.message || "Failed to create organization");
        } else {
            onSuccess?.();
        }
        setLoading(false);
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
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Create Organization
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};
