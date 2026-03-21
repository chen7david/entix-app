import { Upload, App } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

const { Dragger } = Upload;

interface UploaderProps {
    organizationId: string;
    onUploadSuccess?: () => void;
    allowedFileTypes?: string[];
    maxNumberOfFiles?: number;
    maxFileSize?: number;
}

export const Uploader = ({
    organizationId,
    onUploadSuccess,
    allowedFileTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    maxNumberOfFiles = 10,
    maxFileSize = 1024 * 1024 * 500, // 500MB limit
}: UploaderProps) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const props: UploadProps = {
        name: 'file',
        multiple: true,
        accept: allowedFileTypes.join(','),
        maxCount: maxNumberOfFiles,
        customRequest: async (options) => {
            const { file, onSuccess, onError, onProgress } = options;
            const fileObj = file as File;

            if (fileObj.size > maxFileSize) {
                const errorMsg = `File must be smaller than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
                onError?.(new Error(errorMsg));
                message.error(errorMsg);
                return;
            }

            try {
                // 1. Get presigned URL
                const response = await fetch(`/api/v1/orgs/${organizationId}/uploads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalName: fileObj.name,
                        contentType: fileObj.type || 'application/octet-stream',
                        fileSize: fileObj.size,
                    }),
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const data = await response.json();

                // 2. Upload to R2 directly with PUT
                const uploadResponse = await fetch(data.presignedUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': fileObj.type || 'application/octet-stream',
                    },
                    body: fileObj,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload file to storage');
                }

                onProgress?.({ percent: 100 });

                // 3. Mark as complete
                const completeResponse = await fetch(`/api/v1/orgs/${organizationId}/uploads/${data.uploadId}/complete`, {
                    method: 'POST',
                });

                if (!completeResponse.ok) {
                    throw new Error('Failed to complete upload registration');
                }

                queryClient.invalidateQueries({ queryKey: ["organizationUploads", organizationId] });
                onUploadSuccess?.();
                onSuccess?.("ok");
                message.success(`${fileObj.name} file uploaded successfully.`);
            } catch (err: any) {
                console.error("Upload error", err);
                onError?.(err);
                message.error(`${fileObj.name} file upload failed.`);
            }
        },
        onDrop(e) {
            console.log('Dropped files', e.dataTransfer.files);
        },
    };

    return (
        <div className="w-full">
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                    Max file size: {Math.round(maxFileSize / (1024 * 1024))}MB. Allowed types: {allowedFileTypes.join(', ')}
                </p>
            </Dragger>
        </div>
    );
};
