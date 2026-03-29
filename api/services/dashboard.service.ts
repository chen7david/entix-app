import type { DashboardRepository } from "@api/repositories/dashboard.repository";

export class DashboardService {
    constructor(private dashboardRepo: DashboardRepository) {}

    async getDashboardMetrics(organizationId: string) {
        return await this.dashboardRepo.getDashboardMetrics(organizationId);
    }
}
