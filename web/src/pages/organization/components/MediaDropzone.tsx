import React from 'react';
import { Upload, App } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useMedia } from '@web/src/hooks/organization/useMedia';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useSetAtom } from 'jotai';
import { uploadQueueAtom, isUploadWindowVisibleAtom, type UploadTask } from '@web/src/store/upload.store';

const { Dragger } = Upload;

export const MediaDropzone: React.FC<{ type: 'video' | 'audio' | 'all' }> = ({ type }) => {
    const { message } = App.useApp();
    const { activeOrganization } = useOrganization();
    const { createMedia } = useMedia();
    const setQueue = useSetAtom(uploadQueueAtom);
    const setIsUploadWindowVisible = useSetAtom(isUploadWindowVisibleAtom);

    const organizationId = activeOrganization?.id;

    const props: UploadProps = {
        name: 'file',
        multiple: true,
        accept: type === 'all' 
            ? 'video/mp4,audio/mpeg,audio/mp4,audio/m4a,audio/x-m4a,.m4a' 
            : type === 'video' 
                ? 'video/mp4' 
                : 'audio/mpeg,audio/mp4,audio/m4a,audio/x-m4a,.m4a',
        showUploadList: false,
        beforeUpload: (file) => {
            const isVideo = type === 'video';
            const allowedVideo = ['video/mp4'];
            const allowedAudio = ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
            const ext = file.name.slice((Math.max(0, file.name.lastIndexOf(".")) || Infinity) + 1).toLowerCase();
            
            let isValid = false;
            if (type === 'all') {
                isValid = allowedVideo.includes(file.type) || allowedAudio.includes(file.type) || ext === 'm4a' || ext === 'mp3';
            } else if (isVideo) {
                isValid = allowedVideo.includes(file.type);
            } else {
                isValid = allowedAudio.includes(file.type) || ext === 'm4a' || ext === 'mp3';
            }

            if (!isValid) {
                message.error(`${file.name} is not a supported format.`);
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async (options) => {
            if (!organizationId) {
                message.error("Organization context lost");
                return;
            }

            const { file, onSuccess, onError } = options;
            const fileObj = file as File;
            const taskId = crypto.randomUUID();

            const taskType = fileObj.type.startsWith('video/') ? 'video' : 'audio';

            setQueue(q => [...q, {
                id: taskId,
                originalName: fileObj.name,
                progress: 0,
                status: 'pending',
                type: taskType,
            }]);
            setIsUploadWindowVisible(true);

            const updateTask = (updates: Partial<UploadTask>) => {
                setQueue(q => q.map(t => t.id === taskId ? { ...t, ...updates } : t));
            };

            try {
                updateTask({ status: 'uploading', progress: 10 });
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
                
                updateTask({ progress: 20 });

                // 2. Upload to R2 directly with PUT using XMLHttpRequest for progress
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    updateTask({ xhr });

                    xhr.open('PUT', data.presignedUrl);
                    xhr.setRequestHeader('Content-Type', fileObj.type || 'application/octet-stream');
                    
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            const percent = (e.loaded / e.total) * 100;
                            // Map 20% to 90% for the actual upload phase
                            updateTask({ progress: 20 + (percent * 0.7) });
                        }
                    };
                    
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(xhr.response);
                        } else {
                            reject(new Error('Failed to upload file to storage'));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error during upload'));
                    xhr.onabort = () => reject(new Error('Upload aborted'));
                    xhr.send(fileObj);
                });

                updateTask({ status: 'processing', progress: 90 });

                // 3. Mark as complete
                const completeResponse = await fetch(`/api/v1/orgs/${organizationId}/uploads/${data.uploadId}/complete`, {
                    method: 'POST',
                });

                if (!completeResponse.ok) throw new Error('Failed to complete upload registration');

                updateTask({ progress: 95 });

                // 4. Register as Media!
                await createMedia({
                    title: fileObj.name.replace(/\.[^/.]+$/, ""), // Strip extension for title
                    uploadId: data.uploadId,
                });

                updateTask({ status: 'completed', progress: 100 });
                onSuccess?.("ok");
            } catch (err: any) {
                if (err.message === 'Upload aborted') {
                    // Update task gracefully in case it wasn't destroyed
                    updateTask({ status: 'error', progress: 0, errorMessage: 'Upload cancelled' });
                    onError?.(err);
                    return;
                }
                console.error("Upload error", err);
                updateTask({ status: 'error', progress: 100, errorMessage: err.message || 'Upload failed' });
                onError?.(err);
                message.error(`${fileObj.name} file upload failed.`);
            }
        },
    };

    return (
        <div className="w-full mb-8">
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                    {type === 'all'
                       ? 'Allowed types: .mp4, .mp3, .m4a. Your media assets will be processed securely.'
                       : type === 'video' 
                            ? 'Allowed type: video/mp4. Your cinematic assets will be processed for web streaming.' 
                            : 'Allowed types: .mp3, .m4a. Your sonic assets will be processed for web streaming.'}
                </p>
            </Dragger>
        </div>
    );
};
