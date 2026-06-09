import { AppRoutes } from "@shared";
import { CEFR_LEVELS } from "@shared/constants/cefr";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useOrgNavigate } from "@web/src/features/organization";
import {
    useDeleteImportParagraph,
    useFinalizeImportJob,
    useImportJob,
    useUpdateImportParagraph,
} from "@web/src/features/passages/hooks/useBookImport";
import { Alert, Button, Form, Input, Modal, Result, Select, Spin, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

const { Text } = Typography;

export function BookImportReviewPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigateOrg = useOrgNavigate();
    const { data, isLoading, isError, error } = useImportJob(jobId);
    const job = data?.data;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [finalizeOpen, setFinalizeOpen] = useState(false);
    const [form] = Form.useForm<{
        title: string;
        author?: string;
        cefrLevel?: string;
        mode: "single" | "per_paragraph";
    }>();

    const updatePara = useUpdateImportParagraph(jobId);
    const deletePara = useDeleteImportParagraph(jobId);
    const finalize = useFinalizeImportJob(jobId);

    const paragraphs = job?.paragraphs ?? [];
    const active = useMemo(() => paragraphs.filter((p) => !p.isDeleted), [paragraphs]);
    const selected = paragraphs.find((p) => p.id === selectedId);

    useEffect(() => {
        if (job && finalizeOpen) {
            form.setFieldsValue({
                title: job.fileName.replace(/\.[^.]+$/, ""),
                author: "",
                cefrLevel: undefined,
                mode: "single",
            });
        }
    }, [job, finalizeOpen, form]);

    function selectParagraph(id: string, text: string) {
        setSelectedId(id);
        setEditText(text);
    }

    if (!jobId) {
        return (
            <Result
                status="warning"
                title="Missing import job"
                extra={
                    <Button onClick={() => navigateOrg(AppRoutes.org.teaching.textLibrary)}>
                        Back to Text Library
                    </Button>
                }
            />
        );
    }

    if (isLoading) {
        return (
            <div className="p-8">
                <Spin />
            </div>
        );
    }

    if (isError || !job) {
        return (
            <Result
                status="error"
                title="Import job not found"
                subTitle={error instanceof Error ? error.message : "Failed to load import job."}
                extra={
                    <Button onClick={() => navigateOrg(AppRoutes.org.teaching.textLibrary)}>
                        Back to Text Library
                    </Button>
                }
            />
        );
    }

    const canEdit = job.status === "uploading" || job.status === "review";
    const canFinalize = job.status === "review" && active.length > 0;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 md:p-6 border-b">
                <PageHeader
                    title="Review import"
                    subtitle={job?.fileName ?? ""}
                    actions={
                        <Button
                            type="primary"
                            disabled={!canFinalize}
                            onClick={() => setFinalizeOpen(true)}
                        >
                            Finalize →
                        </Button>
                    }
                />
            </div>

            {!canEdit && (
                <div className="px-4 md:px-6 pt-4">
                    <Alert
                        type="info"
                        showIcon
                        message={`This import is ${job.status} and can no longer be edited.`}
                    />
                </div>
            )}

            <div className="flex flex-1 min-h-0">
                <div className="w-80 border-r flex flex-col shrink-0">
                    <div className="p-3 border-b">
                        <Text type="secondary">{active.length} paragraphs</Text>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {paragraphs.map((p) => {
                            const preview = p.cleanedText ?? p.rawText;
                            const deleted = !!p.isDeleted;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    disabled={deleted || !canEdit}
                                    onClick={() => selectParagraph(p.id, preview)}
                                    className={[
                                        "w-full text-left p-3 border-b text-xs",
                                        deleted
                                            ? "opacity-40 line-through"
                                            : "hover:bg-muted/40 cursor-pointer",
                                        p.id === selectedId ? "bg-muted" : "",
                                    ].join(" ")}
                                >
                                    <Text type="secondary" className="block mb-1">
                                        p.{p.pageNumber} §{p.paragraphIndex + 1}
                                    </Text>
                                    <div className="line-clamp-2">{preview}</div>
                                    {canEdit && !deleted && (
                                        <Button
                                            type="link"
                                            danger
                                            size="small"
                                            className="px-0 mt-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deletePara.mutate(p.id);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-4 min-w-0">
                    {selected ? (
                        <>
                            <Text type="secondary">
                                Page {selected.pageNumber} · Paragraph {selected.paragraphIndex + 1}
                            </Text>
                            <Input.TextArea
                                rows={16}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="font-mono"
                            />
                            <Button
                                type="primary"
                                disabled={!canEdit}
                                loading={updatePara.isPending}
                                onClick={() => {
                                    if (!selectedId) return;
                                    updatePara.mutate({
                                        paragraphId: selectedId,
                                        body: { cleanedText: editText },
                                    });
                                }}
                            >
                                Save changes
                            </Button>
                        </>
                    ) : (
                        <Text type="secondary">Select a paragraph on the left to edit it.</Text>
                    )}
                </div>
            </div>

            <Modal
                title="Save as book"
                open={finalizeOpen}
                onCancel={() => setFinalizeOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={finalize.isPending}
                okText="Save book"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) => {
                        finalize.mutate(
                            {
                                title: values.title,
                                author: values.author || undefined,
                                cefrLevel: values.cefrLevel || undefined,
                                mode: values.mode,
                            },
                            {
                                onSuccess: () => {
                                    setFinalizeOpen(false);
                                    navigateOrg(AppRoutes.org.teaching.textLibrary);
                                },
                            }
                        );
                    }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: "Title is required" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="author" label="Author">
                        <Input />
                    </Form.Item>
                    <Form.Item name="cefrLevel" label="CEFR level">
                        <Select
                            allowClear
                            placeholder="— none —"
                            options={CEFR_LEVELS.map((l) => ({ value: l, label: l }))}
                        />
                    </Form.Item>
                    <Form.Item name="mode" label="Import mode" initialValue="single">
                        <Select
                            options={[
                                { value: "single", label: "Single passage (full book)" },
                                {
                                    value: "per_paragraph",
                                    label: "One passage per paragraph",
                                },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
