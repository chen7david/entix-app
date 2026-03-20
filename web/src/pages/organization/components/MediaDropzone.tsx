import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useMedia } from '@web/src/hooks/organization/useMedia';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';

const { Dragger } = Upload;

export const MediaDropzone: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const { createMedia } = useMedia();
    const [isUploading, setIsUploading] = useState(false);

    const organizationId = activeOrganization?.id;

    const props: UploadProps = {
        name: 'file',
        multiple: true,
        accept: 'video/mp4,audio/mpeg',
        showUploadList: { showRemoveIcon: false },
        customRequest: async (options) => {
            if (!organizationId) {
                message.error("Organization context lost");
                return;
            }

            const { file, onSuccess, onError, onProgress } = options;
            const fileObj = file as File;

            setIsUploading(true);

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

                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();

                // 2. Upload to R2 directly with PUT
                const uploadResponse = await fetch(data.presignedUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': fileObj.type || 'application/octet-stream' },
                    body: fileObj,
                });

                if (!uploadResponse.ok) throw new Error('Failed to upload file to storage');

                onProgress?.({ percent: 100 });

                // 3. Mark as complete
                const completeResponse = await fetch(`/api/v1/orgs/${organizationId}/uploads/${data.uploadId}/complete`, {
                    method: 'POST',
                });

                if (!completeResponse.ok) throw new Error('Failed to complete upload registration');

                // 4. Register as Media!
                await createMedia({
                    title: fileObj.name.replace(/\.[^/.]+$/, ""), // Strip extension for title
                    uploadId: data.uploadId,
                });

                onSuccess?.("ok");
            } catch (err: any) {
                console.error("Upload error", err);
                onError?.(err);
                message.error(`${fileObj.name} file upload failed.`);
            } finally {
                setIsUploading(false);
            }
        },
    };

    return (
        <div className="w-full mb-8">
            <Dragger {...props} disabled={isUploading}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined className={isUploading ? "animate-bounce text-blue-500" : ""} />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                    Allowed types: video/mp4, audio/mpeg. Your media will be automatically processed for web streaming.
                </p>
            </Dragger>
        </div>
    );
};
