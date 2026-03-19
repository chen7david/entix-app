import { vi } from 'vitest';

// Global mock for aws4fetch
vi.mock('aws4fetch', () => {
    return {
        AwsClient: vi.fn().mockImplementation(() => ({
            fetch: vi.fn(),
            sign: vi.fn()
        }))
    };
});
