import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useCreateOrganization } from '@web/src/hooks/auth/organization.hook';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const CreateOrganizationPage: React.FC = () => {
    const { mutate: createOrganization, isPending } = useCreateOrganization();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = (values: { name: string; slug: string }) => {
        createOrganization(values, {
            onSuccess: () => {
                message.success('Organization created successfully');
                navigate(links.dashboard.organizations);
            },
            onError: (error) => {
                message.error(error.message);
            }
        });
    };

    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md shadow-lg">
                <div className="text-center mb-6">
                    <Title level={2}>Create Organization</Title>
                    <Text type="secondary">Create a new organization to collaborate with your team.</Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Organization Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter organization name' }]}
                    >
                        <Input placeholder="Acme Corp" />
                    </Form.Item>

                    <Form.Item
                        label="Slug"
                        name="slug"
                        rules={[{ required: true, message: 'Please enter organization slug' }]}
                        help="Unique identifier for your organization URL"
                    >
                        <Input placeholder="acme-corp" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={isPending} size="large">
                            Create Organization
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};
