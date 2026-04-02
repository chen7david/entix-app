import { MemberService } from "@api/services/member.service";
import { vi } from "vitest";

export function mockMemberAddFailure() {
    vi.spyOn(MemberService.prototype, "insertMember").mockRejectedValueOnce(
        new Error("Mocked failure during addMember")
    );
}
