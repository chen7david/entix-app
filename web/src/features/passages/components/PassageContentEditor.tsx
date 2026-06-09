import { defaultPassageDocJson, isProseMirrorDoc } from "@shared/utils/passage-content";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Input, Segmented, Typography } from "antd";
import { useEffect, useState } from "react";
import { parseStoredPassageContent } from "../utils/parse-passage-content";
import { PassageEditorToolbar } from "./PassageEditorToolbar";

type PassageContentEditorProps = {
    /** Set by Ant Design `Form.Item` when used inside a form. */
    value?: string;
    onChange?: (value: string) => void;
};

export function PassageContentEditor({ value = "", onChange }: PassageContentEditorProps) {
    const emitChange = onChange ?? (() => {});
    const [mode, setMode] = useState<"visual" | "json">("visual");
    const [jsonDraft, setJsonDraft] = useState(value || defaultPassageDocJson());
    const [jsonError, setJsonError] = useState<string | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
        ],
        content: parseStoredPassageContent(value || defaultPassageDocJson()),
        editorProps: {
            attributes: {
                class: "passage-editor-content focus:outline-none",
            },
        },
        onUpdate: ({ editor: ed }) => {
            const json = JSON.stringify(ed.getJSON());
            emitChange(json);
            setJsonDraft(json);
            setJsonError(null);
        },
    });

    useEffect(() => {
        if (!editor) return;
        const external = value || defaultPassageDocJson();
        const current = JSON.stringify(editor.getJSON());
        if (external !== current) {
            editor.commands.setContent(parseStoredPassageContent(external), false);
            setJsonDraft(external || defaultPassageDocJson());
        }
    }, [value, editor]);

    const applyJsonDraft = () => {
        try {
            const parsed: unknown = JSON.parse(jsonDraft);
            if (!isProseMirrorDoc(parsed)) {
                setJsonError('Root must be a ProseMirror doc: { "type": "doc", "content": [...] }');
                return;
            }
            emitChange(JSON.stringify(parsed));
            editor?.commands.setContent(parsed, false);
            setJsonError(null);
        } catch {
            setJsonError("Invalid JSON");
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Segmented
                value={mode}
                onChange={(m) => {
                    if (m === "json") {
                        setJsonDraft(
                            editor ? JSON.stringify(editor.getJSON(), null, 2) : jsonDraft
                        );
                    }
                    if (m === "visual" && jsonDraft) {
                        applyJsonDraft();
                    }
                    setMode(m as "visual" | "json");
                }}
                options={[
                    { label: "Formatted", value: "visual" },
                    { label: "JSON (AST)", value: "json" },
                ]}
            />
            {mode === "visual" ? (
                <div
                    className="rounded-lg border overflow-hidden"
                    style={{ borderColor: "var(--ant-color-border)" }}
                >
                    <PassageEditorToolbar editor={editor} />
                    <div className="px-3 py-2 min-h-[220px] bg-[var(--ant-color-bg-container)]">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            ) : (
                <>
                    <Input.TextArea
                        rows={12}
                        value={jsonDraft}
                        onChange={(e) => {
                            setJsonDraft(e.target.value);
                            setJsonError(null);
                        }}
                        className="font-mono text-xs"
                        placeholder='{ "type": "doc", "content": [...] }'
                    />
                    {jsonError ? (
                        <Typography.Text type="danger">{jsonError}</Typography.Text>
                    ) : null}
                    <Typography.Link onClick={applyJsonDraft}>Apply JSON to editor</Typography.Link>
                </>
            )}
            <Typography.Text type="secondary" className="text-xs">
                Use the toolbar for bold, headings, lists, and quotes. Content is saved as
                structured JSON for lessons and the text library.
            </Typography.Text>
        </div>
    );
}
