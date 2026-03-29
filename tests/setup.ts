import { vi } from "vitest";

vi.mock("aws4fetch", () => {
    return {
        AwsClient: vi.fn().mockImplementation(() => ({
            fetch: vi.fn(),
            sign: vi.fn(),
        })),
    };
});
