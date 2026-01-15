import { openAPI } from 'better-auth/plugins';
import { BetterAuthOptions } from 'better-auth';
import { orgRBAC } from './better-auth.rbac';



export const betterAuthGlobalOptions: BetterAuthOptions = {
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    plugins: [openAPI(), orgRBAC()],
    advanced: {
        disableCSRFCheck: true
    },
};