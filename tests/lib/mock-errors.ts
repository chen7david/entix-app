import { MemberRepository } from "@api/repositories/member.repository";
import { vi } from "vitest";

export function mockMemberAddFailure() {
    vi.spyOn(MemberRepository.prototype, "addMember").mockRejectedValueOnce(
        new Error("Mocked failure during addMember")
    );
}
