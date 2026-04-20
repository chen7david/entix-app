import { CloudUploadOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import type { UploadProps } from "antd";
import { App, Spin, theme, Upload } from "antd";
import ImgCrop from "antd-img-crop";
import { useState } from "react";

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
    const { notification } = App.useApp();
    const [uploading, setUploading] = useState(false);
    const { token } = theme.useToken();

    const handleUpload: UploadProps["customRequest"] = async (options) => {
        const { file, onSuccess, onError, onProgress } = options;
        const fileObj = file as File;

        const maxSize = 5 * 1024 * 1024;
        if (fileObj.size > maxSize) {
            const errorMsg = "Cover art must be smaller than 5MB";
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
            const presignResponse = await api.api.v1.orgs[":organizationId"].uploads.$post({
                param: { organizationId },
                json: {
                    originalName: fileObj.name || "cover.jpg",
                    contentType: fileObj.type || "image/jpeg",
                    fileSize: fileObj.size,
                },
            });

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

            if (!uploadResponse.ok) throw new Error("Failed to upload file to storage");
            onProgress?.({ percent: 70 });

            const completeResponse = await api.api.v1.orgs[":organizationId"].uploads[
                ":uploadId"
            ].complete.$post({
                param: { organizationId, uploadId },
            });

            if (!completeResponse.ok) throw new Error("Failed to complete upload registration");
            onProgress?.({ percent: 90 });

            // 4. Trigger caller success handler
            await onUploadSuccess(uploadId);

            onProgress?.({ percent: 100 });
            onSuccess?.("ok");
        } catch (err: any) {
            console.error("Cover upload error:", err);
            onError?.(err);
            notification.error({
                message: "Upload Failed",
                description: err.message || "Failed to upload cover art",
            });
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
                    <div
                        className="w-full aspect-video relative rounded-2xl border-2 border-dashed group-hover:border-[#646cff] transition-colors p-[4px] cursor-pointer group"
                        style={{ borderColor: token.colorBorderSecondary }}
                    >
                        <div
                            className="w-full h-full relative rounded-xl overflow-hidden flex items-center justify-center"
                            style={{ backgroundColor: token.colorBgContainer }}
                        >
                            {/* Display existing cover or placeholder */}
                            {currentImageUrl ? (
                                <img
                                    src={currentImageUrl}
                                    alt="Cover Art"
                                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-60"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-500">
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
                        <div
                            className="absolute -bottom-2 -right-2 border rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-gray-500 group-hover:text-[#646cff] group-hover:border-[#646cff] transition-colors pointer-events-none z-10"
                            style={{
                                backgroundColor: token.colorBgElevated,
                                borderColor: token.colorBorderSecondary,
                            }}
                        >
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
