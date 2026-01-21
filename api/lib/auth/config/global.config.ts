
import { BetterAuthOptions } from 'better-auth';
import { betterAuthPluginsConfig } from './plugins.config';

export const betterAuthGlobalOptions: BetterAuthOptions = {
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    advanced: {
        disableCSRFCheck: true
    },
    plugins: betterAuthPluginsConfig
};