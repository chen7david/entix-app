import { CreateMemberDTO } from "@shared/schemas/dto/member.dto";

export function createMockMemberCreationPayload(
    overrides: Partial<CreateMemberDTO> = {}
): CreateMemberDTO {
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    return {
        email: `member.${uniqueId}@example.com`,
        name: `Test Member ${uniqueId}`,
        role: "member",
        ...overrides,
    };
}
