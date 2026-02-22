import { vi } from "vitest";
import { MemberRepository } from "@api/repositories/member.repository";

export function mockMemberAddFailure() {
    vi.spyOn(MemberRepository.prototype, 'addMember').mockRejectedValueOnce(
        new Error("Mocked failure during addMember")
    );
}
