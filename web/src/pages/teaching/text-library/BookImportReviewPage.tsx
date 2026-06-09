import { AppRoutes } from "@shared";
import { CEFR_LEVELS } from "@shared/constants/cefr";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import {
    useDeleteImportParagraph,
    useFinalizeImportJob,
    useImportJob,
    useUpdateImportParagraph,
} from "@web/src/features/passages/hooks/useBookImport";
import { useOrgNavigate } from "@web/src/features/organization";
import {
    Button,
    Form,
    Input,
    Modal,
    Select,
    Spin,
    Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

const { Text } = Typography;

export function BookImportReviewPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigateOrg = useOrgNavigate();
    const { data, isLoading } = useImportJob(jobId);
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

    if (isLoading || !jobId) {
        return (
            <div className="p-8">
                <Spin />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 md:p-6 border-b">
                <PageHeader
                    title="Review import"
                    subtitle={job?.fileName ?? ""}
                    actions={
                        <Button type="primary" onClick={() => setFinalizeOpen(true)}>
                            Finalize →
                        </Button>
                    }
                />
            </div>

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
                                <div
                                    key={p.id}
                                    role="button"
                                    tabIndex={deleted ? -1 : 0}
                                    onClick={() =>
                                        !deleted && selectParagraph(p.id, preview)
                                    }
                                    className={[
                                        "p-3 border-b text-xs cursor-pointer",
                                        deleted ? "opacity-40 line-through" : "hover:bg-muted/40",
                                        p.id === selectedId ? "bg-muted" : "",
                                    ].join(" ")}
                                >
                                    <Text type="secondary" className="block mb-1">
                                        p.{p.pageNumber} §{p.paragraphIndex + 1}
                                    </Text>
                                    <div className="line-clamp-2">{preview}</div>
                                    {!deleted && (
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
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 p-6 flex flex-col gap-4 min-w-0">
                    {selected ? (
                        <>
                            <Text type="secondary">
                                Page {selected.pageNumber} · Paragraph{" "}
                                {selected.paragraphIndex + 1}
                            </Text>
                            <Input.TextArea
                                rows={16}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="font-mono"
                            />
                            <Button
                                type="primary"
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
