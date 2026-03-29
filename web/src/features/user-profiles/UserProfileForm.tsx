import { useUserProfile } from "@web/src/hooks/api/user-profiles.hooks";
import { App, Button, DatePicker, Form, Input, Select, Spin } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

export const UserProfileForm = ({ userId }: { userId: string }) => {
    const { message } = App.useApp();
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
            message.success("Profile saved successfully");
        } catch {
            message.error("Failed to save profile");
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
                <Button type="primary" htmlType="submit" loading={upsertProfile.isPending}>
                    Save Changes
                </Button>
            </Form.Item>
        </Form>
    );
};
