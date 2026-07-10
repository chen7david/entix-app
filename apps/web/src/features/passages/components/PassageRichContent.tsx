import { defaultPassageDocJson } from "@shared/utils/passage-content";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Skeleton } from "antd";
import { useEffect } from "react";
import { parseStoredPassageContent } from "../utils/parse-passage-content";

type PassageRichContentProps = {
    content: string | null | undefined;
    loading?: boolean;
};

const passageExtensions = [
    StarterKit.configure({
        heading: { levels: [1, 2, 3] },
    }),
];

/** Read-only formatted passage (headings, lists, bold, etc.). */
export function PassageRichContent({ content, loading }: PassageRichContentProps) {
    const editor = useEditor({
        extensions: passageExtensions,
        content: parseStoredPassageContent(content ?? defaultPassageDocJson()),
        editable: false,
        editorProps: {
            attributes: {
                class: "passage-rich-content",
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        editor.commands.setContent(parseStoredPassageContent(content ?? defaultPassageDocJson()), {
            emitUpdate: false,
        });
    }, [content, editor]);

    if (loading) {
        return <Skeleton active paragraph={{ rows: 3 }} />;
    }

    if (!content?.trim()) {
        return null;
    }

    return <EditorContent editor={editor} />;
}
