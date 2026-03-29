import { atom } from "jotai";

export interface UploadTask {
    id: string; // unique internal task id
    originalName: string;
    progress: number; // 0-100
    status: "pending" | "uploading" | "processing" | "completed" | "error";
    errorMessage?: string;
    type: "audio" | "video" | "image" | "unknown";
    xhr?: XMLHttpRequest;
}

export const uploadQueueAtom = atom<UploadTask[]>([]);
export const isUploadWindowMinimizedAtom = atom<boolean>(false);
export const isUploadWindowVisibleAtom = atom<boolean>(false);

// Derived atom to check if there are active uploads
export const hasActiveUploadsAtom = atom((get) => {
    const queue = get(uploadQueueAtom);
    return queue.some(
        (t) => t.status === "pending" || t.status === "uploading" || t.status === "processing"
    );
});
