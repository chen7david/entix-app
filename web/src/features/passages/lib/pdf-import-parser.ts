import type { PDFPageProxy } from "pdfjs-dist";

export type ParsedParagraph = {
    pageNumber: number;
    paragraphIndex: number;
    rawText: string;
};

/** Below this length we treat the page as image-only and run OCR. */
const MIN_TEXT_CHARS_PER_PAGE = 50;

export function isPdfPasswordError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const name = "name" in err ? String(err.name) : "";
    const message = "message" in err ? String(err.message) : String(err);
    return (
        name === "PasswordException" ||
        /password/i.test(message) ||
        (typeof (err as { code?: number }).code === "number" &&
            (err as { code: number }).code >= 1 &&
            (err as { code: number }).code <= 2)
    );
}

export function splitIntoParagraphs(text: string, pageNumber: number, out: ParsedParagraph[]) {
    const normalized = text.replace(/\r\n/g, "\n");
    const rawParas = normalized
        .split(/\n{2,}/)
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter((s) => s.length > 10);

    if (rawParas.length > 0) {
        rawParas.forEach((rawText, paragraphIndex) => {
            out.push({ pageNumber, paragraphIndex, rawText });
        });
        return;
    }

    const single = normalized.replace(/\s+/g, " ").trim();
    if (single.length > 10) {
        out.push({ pageNumber, paragraphIndex: 0, rawText: single });
    }
}

function extractPageText(
    items: Array<{ str?: string; transform?: number[]; hasEOL?: boolean }>
): string {
    const parts: string[] = [];
    let lastY: number | undefined;

    for (const item of items) {
        if (typeof item.str !== "string" || !item.str) continue;
        const y = item.transform?.[5];
        if (lastY !== undefined && y !== undefined && Math.abs(y - lastY) > 2) {
            parts.push("\n");
        } else if (parts.length > 0 && !parts[parts.length - 1]?.endsWith("\n")) {
            parts.push(" ");
        }
        parts.push(item.str);
        if (item.hasEOL) parts.push("\n");
        lastY = y;
    }

    return parts
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
}

async function configurePdfWorker() {
    const { GlobalWorkerOptions } = await import("pdfjs-dist");
    GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
    ).toString();
}

async function ocrRenderedPage(
    page: PDFPageProxy,
    worker: { recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }> }
) {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas for OCR");

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const { data } = await worker.recognize(canvas);
    return data.text;
}

export async function parsePdfToParagraphs(
    file: File,
    options?: {
        password?: string;
        onProgress?: (message: string) => void;
    }
): Promise<ParsedParagraph[]> {
    await configurePdfWorker();
    const { getDocument } = await import("pdfjs-dist");

    const buffer = await file.arrayBuffer();
    const loadingTask = getDocument({
        data: buffer,
        ...(options?.password !== undefined ? { password: options.password } : {}),
    });
    const pdf = await loadingTask.promise;
    const results: ParsedParagraph[] = [];

    const { createWorker } = await import("tesseract.js");
    let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

    try {
        for (let p = 1; p <= pdf.numPages; p++) {
            options?.onProgress?.(`Reading page ${p} of ${pdf.numPages}…`);
            const page = await pdf.getPage(p);
            const textContent = await page.getTextContent();
            const pageText = extractPageText(
                textContent.items as Array<{
                    str?: string;
                    transform?: number[];
                    hasEOL?: boolean;
                }>
            );

            if (pageText.trim().length >= MIN_TEXT_CHARS_PER_PAGE) {
                splitIntoParagraphs(pageText, p, results);
                continue;
            }

            options?.onProgress?.(`Running OCR on page ${p} of ${pdf.numPages}…`);
            if (!ocrWorker) {
                ocrWorker = await createWorker("eng");
            }
            const ocrText = await ocrRenderedPage(page, ocrWorker);
            splitIntoParagraphs(ocrText, p, results);
        }
    } finally {
        await ocrWorker?.terminate();
    }

    return results;
}
