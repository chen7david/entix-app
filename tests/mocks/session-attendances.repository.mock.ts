import type { SessionAttendancesRepository } from "@api/repositories/session-attendances.repository";
import type { Mocked } from "vitest";
import { vi } from "vitest";

export type SessionAttendancesRepoMock = Mocked<
    Pick<SessionAttendancesRepository, "getBySessionAndOrg" | "findById">
>;

export const makeSessionAttendancesRepoMock = (): SessionAttendancesRepoMock => ({
    getBySessionAndOrg: vi.fn(),
    findById: vi.fn(),
});
