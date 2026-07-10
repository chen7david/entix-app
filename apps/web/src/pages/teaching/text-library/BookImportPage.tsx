import { UploadOutlined } from "@ant-design/icons";
import { AppRoutes, IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useOrgNavigate } from "@web/src/features/organization";
import {
    useBulkInsertImportParagraphs,
    useCreateImportJob,
} from "@web/src/features/passages/hooks/useBookImport";
import {
    isPdfPasswordError,
    type ParsedParagraph,
    parsePdfToParagraphs,
    splitIntoParagraphs,
} from "@web/src/features/passages/lib/pdf-import-parser";
import { Alert, Input, Modal, Spin, Upload, type UploadProps } from "antd";
import { useState } from "react";

async function parseImage(file: File): Promise<ParsedParagraph[]> {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(file);
    await worker.terminate();
    const results: ParsedParagraph[] = [];
    splitIntoParagraphs(data.text, 1, results);
    return results;
}

const BATCH_SIZE = IMPORT_PARAGRAPH_INSERT_CHUNK_SIZE;

export function BookImportPage() {
    const navigateOrg = useOrgNavigate();
    const [progress, setProgress] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [pdfPassword, setPdfPassword] = useState("");
    const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);

    const createJob = useCreateImportJob();
    const bulkInsert = useBulkInsertImportParagraphs();

    async function ingestParagraphs(
        file: File,
        fileType: "pdf" | "image",
        paragraphs: ParsedParagraph[]
    ) {
        if (!paragraphs.length) {
            setError(
                "No text could be extracted. If the PDF is password-protected, enter the password when prompted. Otherwise try a clearer scan or image."
            );
            return;
        }

        setProgress(`Extracted ${paragraphs.length} paragraphs. Creating job…`);
        const { data: job } = await createJob.mutateAsync({
            fileName: file.name,
            fileType,
        });

        for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
            const batch = paragraphs.slice(i, i + BATCH_SIZE);
            setProgress(
                `Saving paragraphs ${i + 1}–${Math.min(i + BATCH_SIZE, paragraphs.length)} of ${paragraphs.length}…`
            );
            await bulkInsert.mutateAsync({ jobId: job.id, paragraphs: batch });
        }

        navigateOrg(AppRoutes.org.teaching.textLibraryImportReview(job.id));
    }

    async function parseAndUploadPdf(file: File, password?: string) {
        const paragraphs = await parsePdfToParagraphs(file, {
            password,
            onProgress: setProgress,
        });
        await ingestParagraphs(file, "pdf", paragraphs);
    }

    async function handleFile(file: File, pdfPasswordOverride?: string) {
        setError(null);
        setBusy(true);
        try {
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

            if (ext === "pdf") {
                setProgress("Reading PDF…");
                await parseAndUploadPdf(file, pdfPasswordOverride);
            } else if (["png", "jpg", "jpeg", "webp", "tiff"].includes(ext)) {
                setProgress("Running OCR on image…");
                const paragraphs = await parseImage(file);
                await ingestParagraphs(file, "image", paragraphs);
            } else {
                setError("Only PDF and image files are supported in this version.");
            }
        } catch (e) {
            if (extIsPdf(file) && isPdfPasswordError(e) && !pdfPasswordOverride) {
                setPendingPdfFile(file);
                setPdfPassword("");
                setPasswordModalOpen(true);
                setProgress("");
                return;
            }
            setError(e instanceof Error ? e.message : "Something went wrong");
            setProgress("");
        } finally {
            setBusy(false);
        }
    }

    const uploadProps: UploadProps = {
        accept: ".pdf,.png,.jpg,.jpeg,.webp,.tiff",
        showUploadList: false,
        multiple: false,
        beforeUpload: (file) => {
            void handleFile(file);
            return false;
        },
    };

    return (
        <div className="flex flex-col h-full p-4 md:p-6 max-w-2xl">
            <PageHeader
                title="Import a book"
                subtitle="Upload a PDF or image. Text is extracted locally (including OCR for scanned or copy-protected pages), then you can review before saving."
            />

            <Spin spinning={busy} tip={progress || undefined}>
                <Upload.Dragger {...uploadProps} disabled={busy} className="my-6">
                    <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag a PDF or image here</p>
                    <p className="ant-upload-hint text-muted-foreground">
                        Supported: PDF, PNG, JPG, WEBP, TIFF. Password-protected PDFs are supported
                        — you will be prompted for the password.
                    </p>
                </Upload.Dragger>
            </Spin>

            {error && <Alert type="error" message={error} showIcon className="mt-4" />}

            <Modal
                title="PDF password required"
                open={passwordModalOpen}
                okText="Continue"
                confirmLoading={busy}
                onCancel={() => {
                    setPasswordModalOpen(false);
                    setPendingPdfFile(null);
                }}
                onOk={() => {
                    if (!pendingPdfFile) return;
                    setPasswordModalOpen(false);
                    void handleFile(pendingPdfFile, pdfPassword);
                }}
            >
                <p className="mb-3 text-sm text-muted-foreground">
                    This PDF is encrypted. Enter the password used to open it in a PDF reader (not
                    your Entix account password).
                </p>
                <Input.Password
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="PDF password"
                    onPressEnter={() => {
                        if (!pendingPdfFile) return;
                        setPasswordModalOpen(false);
                        void handleFile(pendingPdfFile, pdfPassword);
                    }}
                />
            </Modal>
        </div>
    );
}

function extIsPdf(file: File) {
    return file.name.split(".").pop()?.toLowerCase() === "pdf";
}
