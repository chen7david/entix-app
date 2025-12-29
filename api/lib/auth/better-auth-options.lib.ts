import { BetterAuthOptions } from 'better-auth';
import { organization } from 'better-auth/plugins';

export const betterAuthOptions: BetterAuthOptions = {
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    plugins: [organization()],
    advanced: {
        disableCSRFCheck: true
    },
};