import { MemberRepository } from "@api/repositories/member.repository";
import { vi } from "vitest";

export function mockMemberAddFailure() {
    vi.spyOn(MemberRepository.prototype, "prepareInsertQuery").mockImplementationOnce(
        function (this: any) {
            return this.db
                .insert(require("@shared/db/schema").authMembers)
                .values({ id: "__mock_conflict__" });
        }
    );
}
