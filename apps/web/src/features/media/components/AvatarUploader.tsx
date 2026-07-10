import { useQueryClient } from "@tanstack/react-query";
import { useUpdateAvatar } from "@web/src/features/user-profiles";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import type { UploadFile, UploadProps } from "antd";
import { App, Modal, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import { useState } from "react";

interface AvatarUploaderProps {
    /** The organization this upload belongs to */
    organizationId: string;
    /** The user whose avatar is being updated */
    userId: string;
    /** Whether the modal is visible */
    open: boolean;
    /** Callback when the modal is closed */
    onClose: () => void;
}

/**
 * Modal component for uploading and cropping a square profile picture.
 *
 * Uses `antd-img-crop` for a square crop overlay (1:1 aspect ratio).
 * The upload flow:
 * 1. User selects an image → ImgCrop provides a square crop dialog
 * 2. Cropped image is uploaded via presigned URL to R2
 * 3. Upload is marked as completed
 * 4. Avatar PATCH endpoint links the upload to the user's profile
 */
export const AvatarUploader = ({ organizationId, userId, open, onClose }: AvatarUploaderProps) => {
    const { notification } = App.useApp();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();
    const updateAvatarMutation = useUpdateAvatar();

    const handleUpload: UploadProps["customRequest"] = async (options) => {
        const { file, onSuccess, onError, onProgress } = options;
        const fileObj = file as File;

        // Max avatar size: 5MB
        const maxSize = 5 * 1024 * 1024;
        if (fileObj.size > maxSize) {
            const errorMsg = "Profile picture must be smaller than 5MB";
            onError?.(new Error(errorMsg));
            notification.error({
                message: "File Too Large",
                description: errorMsg,
            });
            return;
        }

        setUploading(true);

        try {
            const api = getApiClient();
            const presignResponse = await api.api.v1.users[":userId"].avatar["presigned-url"].$post(
                {
                    param: { userId },
                    json: {
                        originalName: fileObj.name || "avatar.jpg",
                        contentType: fileObj.type || "image/jpeg",
                        fileSize: fileObj.size,
                    },
                }
            );

            const { uploadId, presignedUrl } = await hcJson<{
                uploadId: string;
                presignedUrl: string;
            }>(presignResponse);

            // 2. Upload to R2 directly
            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                headers: { "Content-Type": fileObj.type || "image/jpeg" },
                body: fileObj,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload file to storage");
            }

            onProgress?.({ percent: 70 });

            const completeResponse = await api.api.v1.users[":userId"].assets[
                ":uploadId"
            ].complete.$post({
                param: { userId, uploadId },
            });

            if (!completeResponse.ok) {
                throw new Error("Failed to complete upload registration");
            }

            onProgress?.({ percent: 90 });

            // 4. Link upload to user avatar
            await updateAvatarMutation.mutateAsync({ userId, uploadId });

            onProgress?.({ percent: 100 });
            onSuccess?.("ok");

            // Refresh relevant query caches
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", organizationId] });

            // Close modal after brief delay for UX
            setTimeout(() => {
                onClose();
                setFileList([]);
            }, 500);
        } catch (err: any) {
            console.error("Avatar upload error:", err);
            onError?.(err);
            notification.error({
                message: "Upload Failed",
                description: err.message || "Failed to upload profile picture",
            });
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        name: "avatar",
        listType: "picture-card",
        maxCount: 1,
        accept: "image/*",
        fileList,
        customRequest: handleUpload,
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList);
        },
        onRemove: () => {
            setFileList([]);
        },
    };

    return (
        <Modal
            title="Update Profile Picture"
            open={open}
            onCancel={() => {
                if (!uploading) {
                    onClose();
                    setFileList([]);
                }
            }}
            footer={null}
            destroyOnHidden
            width={480}
        >
            <div className="py-4">
                <p className="text-gray-500 mb-4">
                    Select an image and crop it to a square. The image will be used as the member's
                    profile picture.
                </p>
                <ImgCrop
                    rotationSlider
                    aspect={1}
                    quality={0.85}
                    modalTitle="Crop Profile Picture"
                    modalOk="Crop & Upload"
                >
                    <Upload {...uploadProps}>
                        {fileList.length < 1 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl">+</span>
                                <span className="text-xs">Select Image</span>
                            </div>
                        )}
                    </Upload>
                </ImgCrop>
            </div>
        </Modal>
    );
};
