import { InternalServerError } from "@api/errors/app.error";
import { MemberRepository } from "@api/repositories/member.repository";
import { vi } from "vitest";

export function mockMemberAddFailure() {
    vi.spyOn(MemberRepository.prototype, "insert").mockRejectedValueOnce(
        new InternalServerError("Mocked DB failure")
    );
}
