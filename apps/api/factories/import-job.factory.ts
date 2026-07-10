import type { AppContext } from "@api/helpers/types.helpers";
import { ImportJobRepository } from "@api/repositories/passages/import-job.repository";
import { ImportJobService } from "@api/services/passages/import-job.service";
import { getDbClient } from "./db.factory";
import { getPassageService } from "./passage.factory";

export const getImportJobService = (ctx: AppContext): ImportJobService => {
    return new ImportJobService(new ImportJobRepository(getDbClient(ctx)), getPassageService(ctx));
};
