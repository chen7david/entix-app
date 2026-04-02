import type { OrganizationRepository } from "@api/repositories/organization.repository";
import { BaseService } from "./base.service";

export class OrganizationService extends BaseService {
    constructor(private orgRepo: OrganizationRepository) {
        super();
    }

    async findAll() {
        return await this.orgRepo.findAll();
    }

    async findOrganizationById(id: string) {
        return await this.orgRepo.findById(id);
    }

    async getOrganizationById(id: string) {
        const organization = await this.findOrganizationById(id);
        return this.assertExists(organization, `Organization ${id} not found`);
    }

    async findOrganizationBySlug(slug: string) {
        return await this.orgRepo.findBySlug(slug);
    }

    async getOrganizationBySlug(slug: string) {
        const organization = await this.findOrganizationBySlug(slug);
        return this.assertExists(organization, `Organization ${slug} not found`);
    }
}
