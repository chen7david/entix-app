import {
    defaultPassageDocJson,
    isProseMirrorDoc,
    type ProseMirrorNode,
} from "@shared/utils/passage-content";

/** Parse DB `content` (JSON doc or legacy plain text) for TipTap. */
export function parseStoredPassageContent(raw: string): ProseMirrorNode {
    const trimmed = raw.trim();
    if (!trimmed) {
        return JSON.parse(defaultPassageDocJson()) as ProseMirrorNode;
    }
    if (trimmed.startsWith("{")) {
        try {
            const parsed: unknown = JSON.parse(trimmed);
            if (isProseMirrorDoc(parsed)) {
                return parsed;
            }
        } catch {
            /* legacy plain text */
        }
    }
    return {
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [{ type: "text", text: raw }],
            },
        ],
    };
}
