import type { AppDb } from "@api/factories/db.factory";
import { vi } from "vitest";

/**
 * Returns a type-safe mock of the AppDb for unit tests.
 * Zero use of 'any' — using unknown as the strictly allowed bridge for complex interface mocking.
 */
export const createTestDb = (): AppDb => {
    const mockDb = {
        query: {
            paymentRequests: {
                findFirst: vi.fn().mockResolvedValue(null),
            },
        },
        batch: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([]),
            }),
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([]),
                }),
            }),
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnThis(),
        }),
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockResolvedValue([]),
                }),
            }),
        }),
    };

    return mockDb as unknown as AppDb;
};
