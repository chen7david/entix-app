import { KeyOutlined } from "@ant-design/icons";
import { changePassword } from "@web/src/lib/auth-client";
import { Alert, App, Button, Card, Form, Input, Space } from "antd";
import { useState } from "react";

export const PasswordUpdateForm = () => {
    const { notification } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const onFinish = async (values: any) => {
        setLoading(true);
        setErrorMsg(null);

        try {
            const result = await changePassword({
                newPassword: values.newPassword,
                currentPassword: values.currentPassword,
                revokeOtherSessions: true,
            });

            if (result.error) {
                setErrorMsg(result.error.message || "Failed to update password");
                notification.error({
                    message: "Update Failed",
                    description: result.error.message || "Failed to update password",
                });
            } else {
                notification.success({
                    message: "Password Updated",
                    description: "Your password has been updated successfully.",
                });
                form.resetFields();
            }
        } catch (err: any) {
            setErrorMsg(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card bordered={false} className="shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <KeyOutlined className="text-blue-500 text-xl" />
                <h3 className="text-lg font-medium m-0">Change Password</h3>
            </div>

            {errorMsg && <Alert message={errorMsg} type="error" showIcon className="mb-6" />}

            <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
                <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[{ required: true, message: "Please input your current password!" }]}
                >
                    <Input.Password placeholder="Enter current password" />
                </Form.Item>

                <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                        { required: true, message: "Please input your new password!" },
                        { min: 8, message: "Password must be at least 8 characters long." },
                    ]}
                >
                    <Input.Password placeholder="Enter new password" />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label="Confirm New Password"
                    dependencies={["newPassword"]}
                    rules={[
                        { required: true, message: "Please confirm your new password!" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("The two passwords do not match!"));
                            },
                        }),
                    ]}
                >
                    <Input.Password placeholder="Confirm new password" />
                </Form.Item>

                <Form.Item className="mb-0 text-right mt-6">
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Update Password
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};
