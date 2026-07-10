import { useUserProfile } from "@web/src/features/user-profiles";
import { App, Button, DatePicker, Form, Input, Select, Space, Spin } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

export const UserProfileForm = ({ userId }: { userId: string }) => {
    const { notification } = App.useApp();
    const { aggregate, isLoading, upsertProfile } = useUserProfile(userId);
    const [form] = Form.useForm();

    useEffect(() => {
        if (aggregate?.profile) {
            form.setFieldsValue({
                ...aggregate.profile,
                birthDate: aggregate.profile.birthDate ? dayjs(aggregate.profile.birthDate) : null,
            });
        }
    }, [aggregate?.profile, form]);

    const handleSubmit = async (values: any) => {
        try {
            await upsertProfile.mutateAsync({
                ...values,
                birthDate: values.birthDate ? values.birthDate.toDate() : null,
            });
            notification.success({
                message: "Profile Saved",
                description: "Your personal information has been updated successfully.",
            });
        } catch (error: any) {
            notification.error({
                message: "Save Failed",
                description: error.message || "Failed to save profile information.",
            });
        }
    };

    if (isLoading)
        return (
            <div className="p-4 flex justify-center">
                <Spin />
            </div>
        );

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ sex: "other" }}
        >
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="displayName" label="Display Name">
                <Input />
            </Form.Item>
            <Form.Item name="sex" label="Sex" rules={[{ required: true }]}>
                <Select
                    options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Other", value: "other" },
                    ]}
                />
            </Form.Item>
            <Form.Item name="birthDate" label="Birth Date">
                <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item className="mb-0 pt-2">
                <Space>
                    <Button type="primary" htmlType="submit" loading={upsertProfile.isPending}>
                        Save Changes
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};
