import { UI_CONSTANTS } from "@web/src/utils/constants";
import { Button, Drawer, Form, Input, Select } from "antd";
import { useEffect } from "react";
import type { VocabularyItemDTO } from "../hooks/useVocabulary";

interface VocabularyEditDrawerProps {
    visible: boolean;
    item: VocabularyItemDTO | null;
    onCancel: () => void;
    onSave: (values: Partial<VocabularyItemDTO>) => void;
    loading?: boolean;
}

export function VocabularyEditDrawer({
    visible,
    item,
    onCancel,
    onSave,
    loading,
}: VocabularyEditDrawerProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && item) {
            form.setFieldsValue(item);
        } else {
            form.resetFields();
        }
    }, [visible, item, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSave(values);
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    return (
        <Drawer
            title={item ? `Edit: ${item.text}` : "New Vocabulary"}
            open={visible}
            onClose={onCancel}
            width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
            extra={
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                    {item ? "Save Changes" : "Create Word"}
                </Button>
            }
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    name="text"
                    label="Word / Phrase"
                    rules={[{ required: true, message: "Required" }]}
                >
                    <Input disabled={!!item} placeholder="Enter word or phrase" />
                </Form.Item>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="zhTranslation" label="Chinese Translation">
                        <Input placeholder="Optional" />
                    </Form.Item>
                    <Form.Item name="pinyin" label="Pinyin">
                        <Input placeholder="Optional" />
                    </Form.Item>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="ipaUs" label="IPA (US)">
                        <Input placeholder="Optional" />
                    </Form.Item>
                    <Form.Item
                        name="status"
                        label="Status"
                        extra="Queued/processing statuses are pipeline-only (see badge). Cron re-dispatches stale work—manual PATCH allows only these four values."
                    >
                        <Select>
                            <Select.Option value="new">New</Select.Option>
                            <Select.Option value="text_ready">Text Ready</Select.Option>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="review">Review</Select.Option>
                        </Select>
                    </Form.Item>
                </div>
                <Form.Item name="definitionSimple" label="Simple Definition">
                    <Input.TextArea rows={4} placeholder="Optional simple definition" />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
