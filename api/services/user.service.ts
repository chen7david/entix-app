import { UserRepository } from "@api/repositories/user.repository";

export class UserService {
    constructor(private userRepo: UserRepository) { }

    async findUsersByOrganization(organizationId: string, limit: number, cursor?: string, direction: 'next' | 'prev' = 'next', search?: string) {
        return await this.userRepo.findUsersByOrganization(organizationId, limit, cursor, direction, search);
    }

    async findUserById(userId: string) {
        return await this.userRepo.findUserById(userId);
    }

    async updateUser(userId: string, data: Partial<{ email: string; name: string; image: string | null }>) {
        return await this.userRepo.updateUser(userId, data);
    }
}
