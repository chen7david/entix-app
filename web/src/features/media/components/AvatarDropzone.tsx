import { CloudUploadOutlined, UserOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useBetterAuth } from "@web/src/features/auth";
import { useUpdateAvatar } from "@web/src/features/user-profiles";
import type { UploadProps } from "antd";
import { App, Avatar, Spin, theme, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import { useState } from "react";

interface AvatarDropzoneProps {
    /** The organization this upload belongs to */
    organizationId: string;
    /** The user whose avatar is being updated */
    userId: string;
    /** Current avatar URL to display (with Cloudflare resizing applied, e.g. lg/xl) */
    currentImageUrl?: string;
    /** Size of the dropzone (in pixels) */
    size?: number;
    /** Additional CSS class */
    className?: string;
}

const { useToken } = theme;

export const AvatarDropzone = ({
    organizationId,
    userId,
    currentImageUrl,
    size = 120,
    className = "",
}: AvatarDropzoneProps) => {
    const { message } = App.useApp();
    const { token } = useToken();
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();
    const updateAvatarMutation = useUpdateAvatar(organizationId);
    const { session, refetch } = useBetterAuth();

    const handleUpload: UploadProps["customRequest"] = async (options) => {
        const { file, onSuccess, onError, onProgress } = options;
        const fileObj = file as File;

        // Max avatar size: 5MB
        const maxSize = 5 * 1024 * 1024;
        if (fileObj.size > maxSize) {
            const errorMsg = "Profile picture must be smaller than 5MB";
            onError?.(new Error(errorMsg));
            message.error(errorMsg);
            return;
        }

        setUploading(true);
        // Set an artificial "0%" progress state
        onProgress?.({ percent: 0 });

        try {
            // 1. Request presigned URL via the dedicated user avatar endpoint
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

            // 3. Mark upload as complete via user assets endpoint
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

            // Refresh relevant query caches
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", organizationId] });
            queryClient.invalidateQueries({ queryKey: ["organizationMembers", organizationId] });

            // Note: If on ProfilePage, user session needs refetching possibly;
            // The Auth lib handles useSession refresh, but we might want to trigger global invalidations if needed.
            // Assuming session query gets invalidated or polled.
        } catch (err: any) {
            console.error("Avatar upload error:", err);
            onError?.(err);
            message.error(err.message || "Failed to upload profile picture");
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        name: "avatar",
        accept: "image/*",
        showUploadList: false,
        customRequest: handleUpload,
    };

    return (
        <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
            <ImgCrop
                rotationSlider
                aspect={1}
                quality={0.85}
                modalTitle="Crop Profile Picture"
                modalOk="Crop & Upload"
            >
                <Upload
                    {...uploadProps}
                    className="w-full h-full block [&_.ant-upload]:w-full [&_.ant-upload]:h-full [&_.ant-upload]:block relative group cursor-pointer"
                >
                    <div
                        className="w-full h-full relative rounded-full flex items-center justify-center border-2 border-dashed group-hover:border-[#646cff] transition-colors"
                        style={{
                            width: size,
                            height: size,
                            padding: "4px",
                            borderColor: token.colorBorderSecondary,
                        }}
                    >
                        <div
                            className="w-full h-full relative rounded-full overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: token.colorBgContainer }}
                        >
                            {/* Display existing avatar or placeholder */}
                            <Avatar
                                size={size - 12}
                                src={currentImageUrl}
                                icon={<UserOutlined />}
                                className="transition-opacity duration-300 group-hover:opacity-60 flex-shrink-0"
                                style={{ margin: 0, padding: 0 }}
                            />

                            {/* Hover Overlay */}
                            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-[#646cff]/80 text-white pointer-events-none">
                                {uploading ? (
                                    <Spin className="text-white" />
                                ) : (
                                    <>
                                        <CloudUploadOutlined className="text-2xl mb-1" />
                                        <span className="text-xs font-medium px-2 text-center text-white/90">
                                            Update
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Floating Upload Indicator Badge */}
                        <div className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-gray-500 group-hover:text-[#646cff] group-hover:border-[#646cff] transition-colors pointer-events-none z-10">
                            <CloudUploadOutlined className="text-base" />
                        </div>
                    </div>
                </Upload>
            </ImgCrop>
        </div>
    );
};
