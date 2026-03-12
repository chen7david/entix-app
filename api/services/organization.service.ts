import { OrganizationRepository } from "@api/repositories/organization.repository";

export class OrganizationService {
    constructor(private orgRepo: OrganizationRepository) { }

    async findAll() {
        return await this.orgRepo.findAll();
    }

    async findById(id: string) {
        return await this.orgRepo.findById(id);
    }

    async findBySlug(slug: string) {
        return await this.orgRepo.findBySlug(slug);
    }
}
