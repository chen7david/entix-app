import {
    BoldOutlined,
    ItalicOutlined,
    OrderedListOutlined,
    RedoOutlined,
    StrikethroughOutlined,
    UndoOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import type { Editor } from "@tiptap/react";
import { Button, Divider, Space, Tooltip } from "antd";
import type React from "react";
import { useEffect, useReducer } from "react";

type PassageEditorToolbarProps = {
    editor: Editor | null;
};

function ToolbarButton(props: {
    title: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <Tooltip title={props.title}>
            <Button
                type="text"
                size="small"
                disabled={props.disabled}
                aria-label={props.title}
                className={
                    props.active
                        ? "!text-[var(--ant-color-primary)] !bg-[var(--ant-color-primary-bg)]"
                        : ""
                }
                onMouseDown={(e) => {
                    e.preventDefault();
                    props.onClick();
                }}
            >
                {props.children}
            </Button>
        </Tooltip>
    );
}

export function PassageEditorToolbar({ editor }: PassageEditorToolbarProps) {
    const [, refresh] = useReducer((n: number) => n + 1, 0);

    useEffect(() => {
        if (!editor) return;
        const onChange = () => refresh();
        editor.on("selectionUpdate", onChange);
        editor.on("transaction", onChange);
        return () => {
            editor.off("selectionUpdate", onChange);
            editor.off("transaction", onChange);
        };
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div
            className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b rounded-t-lg"
            style={{
                borderColor: "var(--ant-color-border)",
                background: "var(--ant-color-fill-quaternary)",
            }}
        >
            <Space size={2} wrap>
                <ToolbarButton
                    title="Undo"
                    disabled={!editor.can().chain().focus().undo().run()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <UndoOutlined />
                </ToolbarButton>
                <ToolbarButton
                    title="Redo"
                    disabled={!editor.can().chain().focus().redo().run()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <RedoOutlined />
                </ToolbarButton>

                <Divider type="vertical" className="!h-5 !mx-0.5" />

                <ToolbarButton
                    title="Bold"
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <BoldOutlined />
                </ToolbarButton>
                <ToolbarButton
                    title="Italic"
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <ItalicOutlined />
                </ToolbarButton>
                <ToolbarButton
                    title="Strikethrough"
                    active={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <StrikethroughOutlined />
                </ToolbarButton>

                <Divider type="vertical" className="!h-5 !mx-0.5" />

                <ToolbarButton
                    title="Heading 1"
                    active={editor.isActive("heading", { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <span className="text-xs font-bold px-0.5">H1</span>
                </ToolbarButton>
                <ToolbarButton
                    title="Heading 2"
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <span className="text-xs font-bold px-0.5">H2</span>
                </ToolbarButton>
                <ToolbarButton
                    title="Heading 3"
                    active={editor.isActive("heading", { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    <span className="text-xs font-bold px-0.5">H3</span>
                </ToolbarButton>
                <ToolbarButton
                    title="Paragraph"
                    active={editor.isActive("paragraph")}
                    onClick={() => editor.chain().focus().setParagraph().run()}
                >
                    <span className="text-xs px-0.5">P</span>
                </ToolbarButton>

                <Divider type="vertical" className="!h-5 !mx-0.5" />

                <ToolbarButton
                    title="Bullet list"
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <UnorderedListOutlined />
                </ToolbarButton>
                <ToolbarButton
                    title="Numbered list"
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <OrderedListOutlined />
                </ToolbarButton>
                <ToolbarButton
                    title="Block quote"
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <span className="text-sm leading-none">“</span>
                </ToolbarButton>
            </Space>
        </div>
    );
}
