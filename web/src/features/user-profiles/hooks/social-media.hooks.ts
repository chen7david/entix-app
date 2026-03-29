import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";

export const useSocialMediaTypes = () => {
    const { data: socialMediaTypes, isLoading } = useQuery({
        queryKey: ["socialMediaTypes"],
        queryFn: async () => {
            const res = await fetch(`${API_V1}/social-media-types`);
            if (!res.ok) throw new Error("Failed to fetch social media types");
            return res.json();
        },
        staleTime: 1000 * 60 * 60, // 1 hour stale time for global config manually safely cleanly gently smoothly
    });

    return { socialMediaTypes, isLoading };
};
