import { useState } from "react";
import { Upload, message, Spin } from "antd";
import ImgCrop from "antd-img-crop";
import type { UploadProps } from "antd";
import { VideoCameraOutlined, CloudUploadOutlined } from "@ant-design/icons";

interface CoverArtUploaderProps {
    organizationId: string;
    currentImageUrl?: string | null;
    /** Standard 16:9 for videos/playlists, or pass custom aspect ratio */
    aspectRatio?: number;
    /** Callback triggered after a successful R2 upload */
    onUploadSuccess: (uploadId: string) => Promise<void>;
}

export const CoverArtUploader = ({
    organizationId,
    currentImageUrl,
    aspectRatio = 16 / 9,
    onUploadSuccess,
}: CoverArtUploaderProps) => {
    const [uploading, setUploading] = useState(false);

    const handleUpload: UploadProps["customRequest"] = async (options) => {
        const { file, onSuccess, onError, onProgress } = options;
        const fileObj = file as File;

        const maxSize = 5 * 1024 * 1024;
        if (fileObj.size > maxSize) {
            const errorMsg = "Cover art must be smaller than 5MB";
            onError?.(new Error(errorMsg));
            message.error(errorMsg);
            return;
        }

        setUploading(true);

        try {
            // 1. Request presigned URL
            const presignResponse = await fetch(`/api/v1/orgs/${organizationId}/uploads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originalName: fileObj.name || "cover.jpg",
                    contentType: fileObj.type || "image/jpeg",
                    fileSize: fileObj.size,
                }),
            });

            if (!presignResponse.ok) throw new Error(await presignResponse.text());
            const { uploadId, presignedUrl } = await presignResponse.json();

            // 2. Upload to R2 directly
            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                headers: { "Content-Type": fileObj.type || "image/jpeg" },
                body: fileObj,
            });

            if (!uploadResponse.ok) throw new Error("Failed to upload file to storage");
            onProgress?.({ percent: 70 });

            // 3. Mark upload as complete
            const completeResponse = await fetch(
                `/api/v1/orgs/${organizationId}/uploads/${uploadId}/complete`,
                { method: "POST" }
            );

            if (!completeResponse.ok) throw new Error("Failed to complete upload registration");
            onProgress?.({ percent: 90 });

            // 4. Trigger caller success handler
            await onUploadSuccess(uploadId);

            onProgress?.({ percent: 100 });
            onSuccess?.("ok");
        } catch (err: any) {
            console.error("Cover upload error:", err);
            onError?.(err);
            message.error(err.message || "Failed to upload cover art");
        } finally {
            setUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        name: "cover",
        listType: "picture-card",
        showUploadList: false, // We render the image manually below to avoid Antd's tiny nested list
        maxCount: 1,
        accept: "image/*",
        customRequest: handleUpload,
    };

    return (
        <>
            <ImgCrop
                rotationSlider
                aspect={aspectRatio}
                quality={0.85}
                modalTitle="Crop Video Cover"
                modalOk="Crop & Upload"
            >
                <Upload {...uploadProps} className="w-full block !mb-0 cover-art-uploader">
                    <div className="w-full aspect-video relative rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 group-hover:border-[#646cff] transition-colors p-[4px] cursor-pointer group">
                    <div className="w-full h-full relative rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                        {/* Display existing cover or placeholder */}
                        {currentImageUrl ? (
                            <img src={currentImageUrl} alt="Cover Art" className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-60" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <VideoCameraOutlined className="text-3xl mb-2 opacity-50" />
                                <span className="text-sm font-medium">Upload Cover</span>
                                <span className="text-xs opacity-70 mt-1">16:9 format</span>
                            </div>
                        )}

                        {/* Hover Overlay matching Member Avatar */}
                        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-[#646cff]/80 text-white pointer-events-none">
                            {uploading ? (
                                <Spin className="text-white" />
                            ) : (
                                <>
                                    <CloudUploadOutlined className="text-2xl mb-1" />
                                    <span className="text-xs font-medium px-2 text-center text-white/90">
                                        Update Cover
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Floating Upload Indicator Badge matching Member Avatar */}
                    <div className="absolute -bottom-2 -right-2 bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-gray-500 group-hover:text-[#646cff] group-hover:border-[#646cff] transition-colors pointer-events-none z-10">
                        <CloudUploadOutlined className="text-base" />
                    </div>
                </div>
                </Upload>
            </ImgCrop>
            <style>{`
                .cover-art-uploader .ant-upload.ant-upload-select {
                    width: 100% !important;
                    height: auto !important;
                    border: none !important;
                    background: transparent !important;
                    padding: 0 !important;
                    display: block !important;
                }
            `}</style>
        </>
    );
};
