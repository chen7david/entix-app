import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_REFERENCE_MS } from "@web/src/lib/query-config";

export const useSocialMediaTypes = () => {
    const { data: socialMediaTypes, isLoading } = useQuery({
        queryKey: ["socialMediaTypes"],
        queryFn: async () => {
            const res = await fetch(`${API_V1}/social-media-types`);
            if (!res.ok) throw new Error("Failed to fetch social media types");
            return res.json();
        },
        staleTime: QUERY_STALE_REFERENCE_MS,
    });

    return { socialMediaTypes, isLoading };
};
