export const links = {
    auth: {
        signIn: '/auth/sign-in',
        signUp: '/auth/sign-up',
        verifyEmail: '/auth/verify-email',
        emailVerificationPending: '/auth/email-verification-pending',
    },
    dashboard: {
        index: '/dashboard',
        profile: '/dashboard/profile',
        lessons: '/dashboard/lessons',
        shop: '/dashboard/shop',
        wallet: '/dashboard/wallet',
        movies: '/dashboard/movies',
        orders: '/dashboard/orders',
    }
} as const;