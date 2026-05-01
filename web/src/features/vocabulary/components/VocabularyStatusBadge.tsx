import type { VocabularyStatus } from "@web/src/features/vocabulary/hooks/useVocabulary";
import { Tag } from "antd";

const STATUS_META: Record<VocabularyStatus, { color: string; label: string }> = {
    new: { color: "default", label: "New" },
    processing_text: { color: "processing", label: "Processing Text" },
    text_ready: { color: "cyan", label: "Text Ready" },
    processing_audio: { color: "blue", label: "Processing Audio" },
    active: { color: "success", label: "Active" },
    review: { color: "warning", label: "Review" },
};

export function VocabularyStatusBadge({ status }: { status: VocabularyStatus | string }) {
    const meta = STATUS_META[status as VocabularyStatus] ?? { color: "default", label: status };
    return <Tag color={meta.color}>{meta.label}</Tag>;
}
