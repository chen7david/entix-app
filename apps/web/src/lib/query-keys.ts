/** Centralized React Query keys — keep invalidations aligned with hook queryKey shapes. */

export const queryKeys = {
    organizations: ["organizations"] as const,

    lessons: {
        list: (organizationId: string, filters?: unknown) =>
            ["lessons", organizationId, filters] as const,
        detail: (organizationId: string, lessonId: string) =>
            ["lesson", organizationId, lessonId] as const,
        enrollmentsMe: (organizationId: string) =>
            ["lesson-enrollments-me", organizationId] as const,
        options: (organizationId: string, searchQuery: string) =>
            ["lesson-options", organizationId, searchQuery] as const,
        objectives: (organizationId: string, lessonId: string) =>
            ["lesson-objectives", organizationId, lessonId] as const,
        playlists: (organizationId: string, lessonId: string) =>
            ["lesson-playlists", organizationId, lessonId] as const,
        vocabulary: (organizationId: string, lessonId: string) =>
            ["lesson-vocabulary", organizationId, lessonId] as const,
        passages: (organizationId: string, lessonId: string) =>
            ["lesson-passages", organizationId, lessonId] as const,
    },

    vocabulary: {
        session: (organizationId: string, sessionId: string) =>
            ["vocabulary", organizationId, sessionId] as const,
        bank: (organizationId: string, filters?: unknown) =>
            ["vocabulary-bank", organizationId, filters] as const,
        bankItem: (organizationId: string, vocabularyId: string) =>
            ["vocabulary-bank-item", organizationId, vocabularyId] as const,
    },

    wallet: {
        /** Matches `useWalletBalance(id, ownerType, orgId)`. */
        balance: (id: string, ownerType: "user" | "org", orgId?: string) =>
            ["walletBalance", id, ownerType, orgId] as const,
    },

    organizationMembers: ["organizationMembers"] as const,
} as const;
