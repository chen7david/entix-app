import { vi } from "vitest";

/** Marks the Workers test isolate so app middleware can silence HTTP request logs. */
(globalThis as { __ENTIX_TEST__?: boolean }).__ENTIX_TEST__ = true;

vi.mock("aws4fetch", () => {
    return {
        AwsClient: vi.fn().mockImplementation(() => ({
            fetch: vi.fn(),
            sign: vi.fn(),
        })),
    };
});
