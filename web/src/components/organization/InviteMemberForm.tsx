import React from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useInviteMember } from '@web/src/hooks/auth/organization.hook';

const { Option } = Select;

export const InviteMemberForm: React.FC = () => {
    const { mutate: inviteMember, isPending } = useInviteMember();
    const [form] = Form.useForm();

    const onFinish = (values: { email: string; role: "admin" | "member" | "owner" }) => {
        inviteMember(values, {
            onSuccess: () => {
                message.success('Invitation sent successfully');
                form.resetFields();
            },
            onError: (error) => {
                message.error(error.message);
            }
        });
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            initialValues={{ role: 'member' }}
        >
            <Form.Item
                label="Email Address"
                name="email"
                rules={[
                    { required: true, message: 'Please enter email address' },
                    { type: 'email', message: 'Please enter a valid email' }
                ]}
            >
                <Input placeholder="colleague@example.com" />
            </Form.Item>

            <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select a role' }]}
            >
                <Select>
                    <Option value="member">Member</Option>
                    <Option value="admin">Admin</Option>
                    <Option value="owner">Owner</Option>
                </Select>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" block loading={isPending}>
                    Send Invitation
                </Button>
            </Form.Item>
        </Form>
    );
};
