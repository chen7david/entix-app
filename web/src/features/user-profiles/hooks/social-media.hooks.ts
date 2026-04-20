import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_REFERENCE_MS } from "@web/src/lib/query-config";

export const useSocialMediaTypes = () => {
    const { data: socialMediaTypes, isLoading } = useQuery({
        queryKey: ["socialMediaTypes"],
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1["social-media-types"].$get();
            return (await hcJson(res)) as any[];
        },
        staleTime: QUERY_STALE_REFERENCE_MS,
    });

    return { socialMediaTypes, isLoading };
};
