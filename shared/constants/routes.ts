export const AppRoutes = {
    auth: {
        signIn: '/auth/sign-in',
        signUp: '/auth/sign-up',
        verifyEmail: '/auth/verify-email',
        emailVerificationPending: '/auth/email-verification-pending',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
    },
    org: {
        dashboard: {
            index: '/dashboard',
            profile: '/dashboard/profile',
            sessions: '/dashboard/sessions',
            settings: '/dashboard/settings',
            changePassword: '/dashboard/change-password',
            lessons: '/dashboard/lessons',
            shop: '/dashboard/shop',
            wallet: '/dashboard/wallet',
            movies: '/dashboard/movies',
            orders: '/dashboard/orders',
        },
        manage: {
            index: '/organizations',
            media: '/media',
            playlists: '/playlists',
            playlistDetail: (id: string | number) => `/playlists/${id}`,
            edit: '/settings',
            invitations: '/invitations',
            members: '/members',
            analytics: '/analytics',
            schedule: '/schedule',
            uploads: '/uploads',
            bulk: '/manage/bulk'
        }
    },
    admin: {
        index: '/admin',
        users: '/admin/users',
        emails: '/admin/emails',
        organizations: '/admin/organizations',
    },
    onboarding: {
        index: '/onboarding',
        noOrganization: '/onboarding/no-organization',
        selectOrganization: '/onboarding/select-organization',
        acceptInvitation: '/onboarding/accept-invitation',
    }
} as const;
