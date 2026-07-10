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
        normalized_text: string;
        zh_translation: string;
        pinyin: string;
        needs_language_review: boolean;
        ipa_us: string;
        syllables_en: string;
        syllables_ipa: string;
        definition_simple: string;
    };
    raw: string;
    repair?: {
        applied: boolean;
        reason: string;
        raw: string;
    };
    generatedAt: string;
};

export type VocabAiAudioTestParams = {
    enText: string;
    zhText: string;
};

export type VocabAiAudioTestResult = {
    testId: string;
    enText: string;
    zhText: string;
    enAudioUrl: string;
    zhAudioUrl: string;
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

export function useVocabAiAudioTest() {
    const client = getApiClient();

    return useMutation({
        mutationFn: async (params: VocabAiAudioTestParams) => {
            const res = await client.api.v1["vocab-ai-test"].audio.$post({
                json: params,
            });
            const payload = await hcJson<{ data: VocabAiAudioTestResult }>(res);
            return payload.data;
        },
    });
}
