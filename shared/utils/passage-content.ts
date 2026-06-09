/** ProseMirror / TipTap document JSON stored in `passages.content`. */
export type ProseMirrorNode = {
    type?: string;
    text?: string;
    content?: ProseMirrorNode[];
};

const EMPTY_DOC: ProseMirrorNode = {
    type: "doc",
    content: [{ type: "paragraph" }],
};

export function defaultPassageDocJson(): string {
    return JSON.stringify(EMPTY_DOC);
}

export function isProseMirrorDoc(value: unknown): value is ProseMirrorNode {
    return (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        (value as ProseMirrorNode).type === "doc"
    );
}

function collectPlainText(node: ProseMirrorNode, parts: string[]): void {
    if (typeof node.text === "string" && node.text.length > 0) {
        parts.push(node.text);
    }
    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            collectPlainText(child, parts);
        }
    }
}

/** Readable text for previews, word counts, and study view. */
export function plainTextFromPassageContent(content: string | null | undefined): string {
    if (content == null || content.trim() === "") {
        return "";
    }
    const trimmed = content.trim();
    if (!trimmed.startsWith("{")) {
        return trimmed;
    }
    try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isProseMirrorDoc(parsed)) {
            const parts: string[] = [];
            collectPlainText(parsed, parts);
            return parts.join(" ").replace(/\s+/g, " ").trim();
        }
    } catch {
        /* fall through */
    }
    return trimmed;
}

export function countPassageWords(content: string | null | undefined): number {
    const plain = plainTextFromPassageContent(content);
    if (!plain) return 0;
    return plain.split(/\s+/).length;
}

export function buildSingleParagraphTipTapDoc(text: string): ProseMirrorNode {
    return {
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: text ? [{ type: "text", text }] : [],
            },
        ],
    };
}

export function buildFullTipTapDoc(texts: string[]): ProseMirrorNode {
    return {
        type: "doc",
        content: texts.map((text) => ({
            type: "paragraph",
            content: text ? [{ type: "text", text }] : [],
        })),
    };
}
