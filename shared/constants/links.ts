import { AppRoutes } from './routes';

/**
 * @deprecated Use `AppRoutes` from `@shared/constants/routes` and `useOrgNavigate()` instead.
 * This object is maintained strictly for legacy compatibility with Authentication and Admin routes.
 * 
 * NOTE: Multi-tenant organization routes (`links.dashboard`, `links.organization`) have been REMOVED
 * to enforce Type Safety. You MUST migrate those components to use `useOrgNavigate`!
 */
export const links = {
    auth: AppRoutes.auth,
    admin: AppRoutes.admin,
    onboarding: AppRoutes.onboarding
} as const;