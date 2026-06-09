import type { ImportFileType } from "@shared/constants/import";
import type {
    FinalizeImportInput,
    ImportJobDto,
    ImportJobParagraphDto,
    UpdateImportParagraphInput,
} from "@shared/schemas/dto/import-job.dto";
import type { TextCollectionDto } from "@shared/schemas/dto/passage.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";

export type ImportJobWithParagraphs = ImportJobDto & {
    paragraphs: ImportJobParagraphDto[];
};

function importsPath(organizationId: string, jobId?: string, suffix?: string) {
    const base = `/api/v1/orgs/${organizationId}/imports`;
    if (!jobId) return base;
    const jobBase = `${base}/${jobId}`;
    return suffix ? `${jobBase}/${suffix}` : jobBase;
}

function paragraphPath(organizationId: string, jobId: string, paragraphId: string) {
    return `${importsPath(organizationId, jobId)}/paragraphs/${paragraphId}`;
}

async function parseResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        throw new Error(await parseApiError(res));
    }
    if (res.status === 204) {
        return undefined as T;
    }
    return hcJson<T>(res);
}

export function useImportJob(jobId: string | undefined) {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated } = useAuth();
    const organizationId = activeOrganization?.id;

    return useQuery({
        queryKey: ["import-job", organizationId, jobId],
        enabled: !!organizationId && !!jobId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            const res = await fetch(importsPath(organizationId!, jobId!), {
                credentials: "include",
            });
            return parseResponse<{ data: ImportJobWithParagraphs }>(res);
        },
    });
}

export function useCreateImportJob() {
    const { message } = App.useApp();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    return useMutation({
        mutationFn: async (body: {
            fileName: string;
            fileType: ImportFileType;
            bucketKey?: string;
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const res = await fetch(importsPath(organizationId), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            return parseResponse<{ data: ImportJobDto }>(res);
        },
        onError: (err) => message.error(err instanceof Error ? err.message : "Failed to create import"),
    });
}

export function useBulkInsertImportParagraphs() {
    const { message } = App.useApp();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    return useMutation({
        mutationFn: async ({
            jobId,
            paragraphs,
        }: {
            jobId: string;
            paragraphs: Array<{
                pageNumber: number;
                paragraphIndex: number;
                rawText: string;
            }>;
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const res = await fetch(`${importsPath(organizationId, jobId)}/paragraphs`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paragraphs }),
            });
            await parseResponse<void>(res);
        },
        onError: (err) =>
            message.error(err instanceof Error ? err.message : "Failed to save paragraphs"),
    });
}

export function useUpdateImportParagraph(jobId: string | undefined) {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    return useMutation({
        mutationFn: async ({
            paragraphId,
            body,
        }: {
            paragraphId: string;
            body: UpdateImportParagraphInput;
        }) => {
            if (!organizationId || !jobId) throw new Error("Organization and job required");
            const res = await fetch(paragraphPath(organizationId, jobId, paragraphId), {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            return parseResponse<{ data: ImportJobParagraphDto }>(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["import-job", organizationId, jobId] });
        },
        onError: (err) =>
            message.error(err instanceof Error ? err.message : "Failed to update paragraph"),
    });
}

export function useDeleteImportParagraph(jobId: string | undefined) {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    return useMutation({
        mutationFn: async (paragraphId: string) => {
            if (!organizationId || !jobId) throw new Error("Organization and job required");
            const res = await fetch(paragraphPath(organizationId, jobId, paragraphId), {
                method: "DELETE",
                credentials: "include",
            });
            await parseResponse<void>(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["import-job", organizationId, jobId] });
        },
        onError: (err) =>
            message.error(err instanceof Error ? err.message : "Failed to delete paragraph"),
    });
}

export function useFinalizeImportJob(jobId: string | undefined) {
    const { message } = App.useApp();
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;

    return useMutation({
        mutationFn: async (body: FinalizeImportInput) => {
            if (!organizationId || !jobId) throw new Error("Organization and job required");
            const res = await fetch(`${importsPath(organizationId, jobId)}/finalize`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            return parseResponse<{ data: TextCollectionDto }>(res);
        },
        onError: (err) =>
            message.error(err instanceof Error ? err.message : "Failed to finalize import"),
    });
}
