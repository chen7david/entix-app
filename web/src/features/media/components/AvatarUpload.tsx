import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useBetterAuth } from "@web/src/features/auth";
import { useUpdateAvatar } from "@web/src/features/user-profiles";
import type { UploadProps } from "antd";
import { App, Avatar, Spin, theme, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import type React from "react";
import { useState } from "react";

interface AvatarUploadProps {
    /** The organization this upload belongs to */
    organizationId: string;
    /** The user whose avatar is being updated */
    userId: string;
    /** Current avatar URL to display */
    currentImageUrl?: string;
    /** Size of the avatar (in pixels) */
    size?: number;
    /** Additional CSS class */
    className?: string;
}

/**
 * Standardized Ant Design Avatar Upload component.
 * Uses picture-circle list type for the native AntD look.
 */
export const AvatarUpload: React.FC<AvatarUploadProps> = ({
    organizationId,
    userId,
    currentImageUrl,
    size = 100,
    className = "",
}) => {
    const { notification } = App.useApp();
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();
    const updateAvatarMutation = useUpdateAvatar();
    const { token } = theme.useToken();
    const { session, refetch } = useBetterAuth();

    const handleUpload: UploadProps["customRequest"] = async (options) => {
        const { file, onSuccess, onError, onProgress } = options;
        const fileObj = file as File;

        // Max avatar size: 5MB
        const maxSize = 5 * 1024 * 1024;
        if (fileObj.size > maxSize) {
            const errorMsg = "Profile picture must be smaller than 5MB";
            onError?.(new Error(errorMsg));
            notification.error({
                message: "Upload Failed",
                description: errorMsg,
            });
            return;
        }

        setUploading(true);
        onProgress?.({ percent: 0 });

        try {
            // 1. Request presigned URL
            const presignResponse = await fetch(`/api/v1/users/${userId}/avatar/presigned-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originalName: fileObj.name || "avatar.jpg",
                    contentType: fileObj.type || "image/jpeg",
                    fileSize: fileObj.size,
                }),
            });

            if (!presignResponse.ok) {
                throw new Error(await presignResponse.text());
            }

            const { uploadId, presignedUrl } = await presignResponse.json();

            // 2. Upload to R2 directly
            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                headers: { "Content-Type": fileObj.type || "image/jpeg" },
                body: fileObj,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload file to storage");
            }

            onProgress?.({ percent: 60 });

            // 3. Mark upload as complete
            const completeResponse = await fetch(
                `/api/v1/users/${userId}/assets/${uploadId}/complete`,
                { method: "POST" }
            );

            if (!completeResponse.ok) {
                throw new Error("Failed to complete upload registration");
            }

            onProgress?.({ percent: 80 });

            // 4. Link upload to user avatar
            await updateAvatarMutation.mutateAsync({ userId, uploadId });

            if (session.data?.user?.id === userId) {
                await refetch();
            }

            onProgress?.({ percent: 100 });
            onSuccess?.("ok");

            // Refresh caches
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", organizationId] });
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        } catch (err: any) {
            onError?.(err);
            notification.error({
                message: "Upload Failed",
                description: err.message || "Failed to upload profile picture",
            });
        } finally {
            setUploading(false);
        }
    };

    const uploadButton = (
        <div className="flex flex-col items-center justify-center">
            {uploading ? <Spin /> : <PlusOutlined style={{ fontSize: 24 }} />}
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>
    );

    return (
        <div className={`flex justify-center items-center ${className}`} style={{ width: "100%" }}>
            <ImgCrop
                rotationSlider
                aspect={1}
                quality={0.85}
                modalTitle="Crop Profile Picture"
                modalOk="Crop & Upload"
            >
                <Upload
                    name="avatar"
                    listType="picture-circle"
                    className="avatar-uploader"
                    showUploadList={false}
                    customRequest={handleUpload}
                    accept="image/*"
                    style={{
                        width: size,
                        height: size,
                    }}
                >
                    <div
                        className="flex items-center justify-center overflow-hidden rounded-full relative group"
                        style={{
                            width: size - 8,
                            height: size - 8,
                        }}
                    >
                        {currentImageUrl ? (
                            <>
                                <Avatar
                                    src={currentImageUrl}
                                    size={size - 8}
                                    icon={<UserOutlined />}
                                    className="transition-opacity duration-300 group-hover:opacity-40"
                                    style={{ border: "none" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <PlusOutlined
                                        style={{ fontSize: 24, color: token.colorPrimary }}
                                    />
                                </div>
                            </>
                        ) : (
                            uploadButton
                        )}
                    </div>
                </Upload>
            </ImgCrop>
            <style>{`
                .avatar-uploader .ant-upload.ant-upload-select {
                    width: ${size}px !important;
                    height: ${size}px !important;
                    margin: 0 !important;
                }
            `}</style>
        </div>
    );
};
