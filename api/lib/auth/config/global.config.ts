
import { BetterAuthOptions } from 'better-auth';
import { getBetterAuthPluginsConfig } from './plugins.config';
import { AppContext } from '@api/helpers/types.helpers';
import { Mailer } from '@api/lib/mail/mailer.lib';

export const betterAuthGlobalOptions = (ctx?: AppContext, mailer?: Mailer): BetterAuthOptions => ({
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    advanced: {
        disableCSRFCheck: true
    },
    plugins: getBetterAuthPluginsConfig(ctx, mailer),
});