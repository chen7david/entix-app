import { Button, Form, Input } from "antd";

export function AddVocabularyForm({
    onSubmit,
    isSubmitting,
}: {
    onSubmit: (text: string) => Promise<void>;
    isSubmitting: boolean;
}) {
    const [form] = Form.useForm<{ text: string }>();

    const handleFinish = async (values: { text: string }) => {
        await onSubmit(values.text.trim());
        form.resetFields();
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
                    { required: true, message: "Please enter vocabulary text" },
                    { min: 1, message: "Vocabulary text cannot be empty" },
                ]}
            >
                <Input placeholder="Enter vocabulary text" allowClear />
            </Form.Item>
            <Form.Item className="mb-2">
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                    Add
                </Button>
            </Form.Item>
        </Form>
    );
}
