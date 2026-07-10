import { Button, Form, Input } from "antd";
import type { InputRef } from "antd/es/input";
import { useRef } from "react";

export function AddObjectiveForm({
    onSubmit,
    isSubmitting,
}: {
    onSubmit: (text: string) => Promise<void>;
    isSubmitting: boolean;
}) {
    const [form] = Form.useForm<{ text: string }>();
    const inputRef = useRef<InputRef>(null);

    const handleFinish = async (values: { text: string }) => {
        await onSubmit(values.text.trim());
        form.setFieldsValue({ text: "" });
        requestAnimationFrame(() => {
            inputRef.current?.focus({ preventScroll: true });
        });
    };

    return (
        <Form
            form={form}
            layout="inline"
            onFinish={handleFinish}
            className="mb-4 w-full flex items-start gap-2"
        >
            <Form.Item
                name="text"
                className="flex-1 min-w-[260px] mb-2"
                rules={[
                    { required: true, message: "Please enter an objective" },
                    { min: 1, message: "Objective text cannot be empty" },
                ]}
            >
                <Input ref={inputRef} placeholder="Enter learning objective" allowClear />
            </Form.Item>
            <Form.Item className="mb-2">
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                    Add
                </Button>
            </Form.Item>
        </Form>
    );
}
