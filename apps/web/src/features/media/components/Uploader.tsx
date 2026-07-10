import { InboxOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import type { UploadProps } from "antd";
import { App, Upload } from "antd";

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
    allowedFileTypes = ["image/*", "video/*", "audio/*", "application/pdf"],
    maxNumberOfFiles = 10,
    maxFileSize = 1024 * 1024 * 500, // 500MB limit
}: UploaderProps) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    const props: UploadProps = {
        name: "file",
        multiple: true,
        accept: allowedFileTypes.join(","),
        maxCount: maxNumberOfFiles,
        customRequest: async (options) => {
            const { file, onSuccess, onError, onProgress } = options;
            const fileObj = file as File;

            if (fileObj.size > maxFileSize) {
                const errorMsg = `File must be smaller than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
                onError?.(new Error(errorMsg));
                notification.error({
                    message: "File Too Large",
                    description: errorMsg,
                });
                return;
            }

            try {
                const api = getApiClient();
                const response = await api.api.v1.orgs[":organizationId"].uploads.$post({
                    param: { organizationId },
                    json: {
                        originalName: fileObj.name,
                        contentType: fileObj.type || "application/octet-stream",
                        fileSize: fileObj.size,
                    },
                });

                const data = await hcJson<{
                    presignedUrl: string;
                    uploadId: string;
                }>(response);

                // 2. Upload to R2 directly with PUT
                const uploadResponse = await fetch(data.presignedUrl, {
                    method: "PUT",
                    headers: {
                        "Content-Type": fileObj.type || "application/octet-stream",
                    },
                    body: fileObj,
                });

                if (!uploadResponse.ok) {
                    throw new Error("Failed to upload file to storage");
                }

                onProgress?.({ percent: 100 });

                const completeResponse = await api.api.v1.orgs[":organizationId"].uploads[
                    ":uploadId"
                ].complete.$post({
                    param: { organizationId, uploadId: data.uploadId },
                });

                if (!completeResponse.ok) {
                    throw new Error("Failed to complete upload registration");
                }

                queryClient.invalidateQueries({
                    queryKey: ["organizationUploads", organizationId],
                });
                onUploadSuccess?.();
                onSuccess?.("ok");
                notification.success({
                    message: "Upload Successful",
                    description: `${fileObj.name} uploaded successfully.`,
                });
            } catch (err: any) {
                console.error("Upload error", err);
                onError?.(err);
                notification.error({
                    message: "Upload Failed",
                    description: `${fileObj.name} file upload failed.`,
                });
            }
        },
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
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
                    Max file size: {Math.round(maxFileSize / (1024 * 1024))}MB. Allowed types:{" "}
                    {allowedFileTypes.join(", ")}
                </p>
            </Dragger>
        </div>
    );
};
