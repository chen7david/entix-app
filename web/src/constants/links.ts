export const links = {
    auth: {
        signIn: '/auth/sign-in',
        signUp: '/auth/sign-up',
        verifyEmail: '/auth/verify-email',
        emailVerificationPending: '/auth/email-verification-pending',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
    },
    dashboard: {
        index: (slug: string) => `/org/${slug}/dashboard`,
        profile: (slug: string) => `/org/${slug}/dashboard/profile`,
        sessions: (slug: string) => `/org/${slug}/dashboard/sessions`,
        settings: (slug: string) => `/org/${slug}/dashboard/settings`,
        changePassword: (slug: string) => `/org/${slug}/dashboard/change-password`,
        lessons: (slug: string) => `/org/${slug}/dashboard/lessons`,
        shop: (slug: string) => `/org/${slug}/dashboard/shop`,
        wallet: (slug: string) => `/org/${slug}/dashboard/wallet`,
        movies: (slug: string) => `/org/${slug}/dashboard/movies`,
        orders: (slug: string) => `/org/${slug}/dashboard/orders`,
    },
    organization: {
        index: (slug: string) => `/org/${slug}/organizations`,
        edit: (slug: string) => `/org/${slug}/settings`,
        invitations: (slug: string) => `/org/${slug}/invitations`,
        members: (slug: string) => `/org/${slug}/members`,
    },
    admin: {
        index: '/admin',
    },
    onboarding: {
        index: '/onboarding',
        noOrganization: '/onboarding/no-organization',
        selectOrganization: '/onboarding/select-organization',
        acceptInvitation: '/onboarding/accept-invitation',
    }
} as const;