import React, { useState } from 'react';
import { Typography, List, Button, Modal, Form, Input, Select, Upload, message, Space, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useMedia, type MediaWithRelations } from '@web/src/hooks/organization/useMedia';

const { Text, Title } = Typography;

interface SubtitleManagerProps {
    media: MediaWithRelations;
    organizationId: string;
}

export const SubtitleManager: React.FC<SubtitleManagerProps> = ({ media, organizationId }) => {
    const { addSubtitle, deleteSubtitle, isAddingSubtitle } = useMedia();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);
    const [form] = Form.useForm();

    const handleUpload = async (fileObj: File): Promise<string> => {
        const maxSize = 2 * 1024 * 1024; // 2MB for VTT
        if (fileObj.size > maxSize) {
            throw new Error("Subtitle file must be smaller than 2MB");
        }
        if (!fileObj.name.endsWith('.vtt')) {
            throw new Error("Only .vtt files are supported");
        }

        // 1. Request presigned URL
        const presignResponse = await fetch(`/api/v1/orgs/${organizationId}/uploads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                originalName: fileObj.name,
                contentType: "text/vtt",
                fileSize: fileObj.size,
            }),
        });

        if (!presignResponse.ok) throw new Error(await presignResponse.text());
        const { uploadId, presignedUrl } = await presignResponse.json();

        // 2. Upload to R2 directly
        const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            headers: { "Content-Type": "text/vtt" },
            body: fileObj,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload file to storage");

        // 3. Mark upload as complete
        const completeResponse = await fetch(
            `/api/v1/orgs/${organizationId}/uploads/${uploadId}/complete`,
            { method: "POST" }
        );

        if (!completeResponse.ok) throw new Error("Failed to complete upload registration");

        return uploadId;
    };

    const onFinish = async (values: any) => {
        if (fileList.length === 0) {
            message.error("Please select a .vtt file to upload");
            return;
        }

        try {
            const uploadId = await handleUpload(fileList[0].originFileObj as File);
            await addSubtitle(media.id, {
                uploadId,
                language: values.language,
                label: values.label,
            });
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
        } catch (error: any) {
            message.error(error.message || "Failed to upload subtitle track");
        }
    };

    return (
        <div className="flex flex-col gap-2 mb-8">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <Title level={5} className="!mb-0">Subtitle Tracks</Title>
                    <Text type="secondary" className="text-sm">Manage multi-language .vtt closed captions.</Text>
                </div>
                <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsModalVisible(true)}
                    size="small"
                >
                    Add Track
                </Button>
            </div>

            <List
                size="small"
                bordered
                dataSource={media.subtitles || []}
                locale={{ emptyText: "No subtitle tracks uploaded" }}
                renderItem={(item) => (
                    <List.Item
                        actions={[
                            <Popconfirm
                                title="Delete Subtitle"
                                description="Are you sure you want to delete this track?"
                                onConfirm={() => deleteSubtitle(media.id, item.id)}
                            >
                                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                            </Popconfirm>
                        ]}
                    >
                        <List.Item.Meta
                            title={<Text className="font-medium">{item.label}</Text>}
                            description={<Text className="text-xs text-gray-500 uppercase">{item.language}</Text>}
                        />
                    </List.Item>
                )}
            />

            <Modal
                title="Upload Subtitle Track"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setFileList([]);
                }}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={onFinish} className="mt-4">
                    <Form.Item
                        name="language"
                        label="Language Code"
                        rules={[{ required: true, message: 'Please select a language code' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Select a language (e.g. en, es)"
                            options={[
                                { value: 'en', label: 'English (en)' },
                                { value: 'es', label: 'Spanish (es)' },
                                { value: 'fr', label: 'French (fr)' },
                                { value: 'de', label: 'German (de)' },
                                { value: 'zh', label: 'Chinese (zh)' },
                                { value: 'ja', label: 'Japanese (ja)' },
                                { value: 'ko', label: 'Korean (ko)' },
                                { value: 'ru', label: 'Russian (ru)' },
                                { value: 'it', label: 'Italian (it)' },
                                { value: 'pt', label: 'Portuguese (pt)' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="label"
                        label="Display Label"
                        rules={[{ required: true, message: 'Please enter a display label' }]}
                    >
                        <Input placeholder="e.g. English (US), Español" />
                    </Form.Item>

                    <Form.Item label="VTT File" required>
                        <Upload
                            accept=".vtt"
                            maxCount={1}
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            beforeUpload={() => false} // Prevent auto-upload
                        >
                            <Button icon={<UploadOutlined />}>Select .vtt File</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item className="mb-0 flex justify-end mt-6">
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={isAddingSubtitle}>
                                Upload Track
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
