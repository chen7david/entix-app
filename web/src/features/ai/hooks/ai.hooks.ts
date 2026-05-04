import { useMutation, useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";

export type VocabAiTestParams = {
    phrase: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
};

export type VocabAiTestResult = {
    model: string;
    prompt: string;
    result: {
        zh_translation: string;
        pinyin: string;
        needs_language_review: boolean;
    };
    raw: string;
    repair?: {
        applied: boolean;
        reason: string;
        raw: string;
    };
    generatedAt: string;
};

export type VocabAiTestError = {
    error: string;
    model: string;
    prompt: string;
    raw: string;
    parsedJson: unknown;
    generatedAt: string;
};

export function useVocabAiTest() {
    const client = getApiClient();

    return useMutation({
        mutationFn: async (params: VocabAiTestParams) => {
            const res = await client.api.v1["vocab-ai-test"].$post({
                json: params,
            });
            const payload = await hcJson<{ data: VocabAiTestResult }>(res);
            return payload.data;
        },
    });
}

export function useOpenWebUiModels() {
    const client = getApiClient();

    return useQuery({
        queryKey: ["ai", "models"],
        queryFn: async () => {
            const res = await client.api.v1["vocab-ai-test"]["openwebui-models"].$post();
            const payload = await hcJson<{ data: { models: string[] } }>(res);
            return payload.data.models;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
