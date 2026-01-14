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
        index: '/dashboard',
        profile: '/dashboard/profile',
        settings: '/dashboard/settings',
        changePassword: '/dashboard/change-password',
        lessons: '/dashboard/lessons',
        shop: '/dashboard/shop',
        wallet: '/dashboard/wallet',
        movies: '/dashboard/movies',
        orders: '/dashboard/orders',
        organizations: '/dashboard/organizations',
        createOrganization: '/dashboard/organizations/create',
    }
} as const;