import { openAPI } from 'better-auth/plugins';
import { BetterAuthOptions } from 'better-auth';
import { orgRBAC } from './better-auth.rbac';
import { Mailer } from '../mail/mailer.lib';

interface BetterAuthGlobalOptionsParams {
    mailer: Mailer;
    frontendUrl: string;
}

export const getBetterAuthGlobalOptions = ({ mailer, frontendUrl }: BetterAuthGlobalOptionsParams): BetterAuthOptions => ({
    appName: 'entix-app',
    basePath: '/api/v1/auth',
    plugins: [openAPI(), orgRBAC({ mailer, frontendUrl })],
    advanced: {
        disableCSRFCheck: true
    },
});