export const links = {
    auth: {
        signIn: '/auth/sign-in',
        signUp: '/auth/sign-up',
        verifyEmail: '/auth/verify-email',
        emailVerificationPending: '/auth/email-verification-pending',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
        noOrganization: '/auth/no-organization',
        selectOrganization: '/auth/select-organization',
    },
    dashboard: {
        index: '/dashboard',
        profile: '/dashboard/profile',
        settings: '/dashboard/settings',
        changePassword: '/dashboard/change-password',
        lessons: '/dashboard/lessons',
        shop: '/dashboard/shop',
        wallet: '/dashboard/wallet',
        movies: '/dashboard/movies',
        orders: '/dashboard/orders',
    },
    organization: {
        index: '/organization',
        create: '/organization/create',
        edit: '/organization/:id',
    }
} as const;