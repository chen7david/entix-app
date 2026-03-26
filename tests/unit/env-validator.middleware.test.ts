import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { envValidatorMiddleware } from '@api/middleware/env-validator.middleware';
import type { AppEnv } from '@api/helpers/types.helpers';
import { parseJson, type ErrorResponse } from '../lib/api-request.helper';

/**
 * Builds a minimal mock Hono app with a test route for env validation testing.
 * We inject just enough bindings to simulate both valid and invalid configurations.
 */
const buildTestApp = (env: Partial<CloudflareBindings>) => {
    const app = new Hono<AppEnv>();
    app.use('*', envValidatorMiddleware());
    app.get('/health', (c) => c.json({ ok: true }, 200));

    return (path: string) =>
        app.request(path, {}, { ...env } as unknown as CloudflareBindings);
};

const validEnv: any = {
    FRONTEND_URL: 'http://localhost:8000',
    BETTER_AUTH_SECRET: '12345678901234567890123456789012',
    RESEND_API_KEY: 're_test_key_1234567890',
    CLOUDFLARE_ACCOUNT_ID: 'mock_account_id',
    R2_ACCESS_KEY_ID: 'mock_r2_access_key',
    R2_SECRET_ACCESS_KEY: 'mock_r2_secret_key',
    R2_BUCKET_NAME: 'mock-bucket',
    PUBLIC_CDN_URL: 'https://cdn.example.com',
};

describe('envValidatorMiddleware', () => {
    it('should allow requests through when all required env vars are present', async () => {
        const res = await buildTestApp(validEnv)('/health');
        expect(res.status).toBe(200);
        const body = await parseJson<{ ok: boolean }>(res);
        expect(body).toEqual({ ok: true });
    });

    it('should return 500 when FRONTEND_URL is missing', async () => {
        const { FRONTEND_URL: _, ...missingFrontend } = validEnv;
        const res = await buildTestApp(missingFrontend)('/health');
        expect(res.status).toBe(500);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
        expect(body.message).toContain('Configuration Error');
    });

    it('should return 500 when BETTER_AUTH_SECRET is too short', async () => {
        const res = await buildTestApp({ ...validEnv, BETTER_AUTH_SECRET: 'tooshort' })('/health');
        expect(res.status).toBe(500);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
    });

    it('should return 500 when R2 credentials are missing', async () => {
        const { R2_ACCESS_KEY_ID: _1, R2_SECRET_ACCESS_KEY: _2, ...missingR2 } = validEnv;
        const res = await buildTestApp(missingR2)('/health');
        expect(res.status).toBe(500);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
    });

    it('should return 500 when RESEND_API_KEY does not start with re_', async () => {
        const res = await buildTestApp({ ...validEnv, RESEND_API_KEY: 'invalid_key_format' })('/health');
        expect(res.status).toBe(500);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
    });
});
