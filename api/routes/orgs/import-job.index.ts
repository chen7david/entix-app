import { createRouter } from "@api/lib/app.lib";
import { ImportJobHandlers } from "./import-job.handlers";
import { ImportJobRoutes } from "./import-job.routes";

export const importJobRoutes = createRouter()
    .openapi(ImportJobRoutes.listJobs, ImportJobHandlers.listJobs)
    .openapi(ImportJobRoutes.createJob, ImportJobHandlers.createJob)
    .openapi(ImportJobRoutes.getJob, ImportJobHandlers.getJob)
    .openapi(ImportJobRoutes.updateJob, ImportJobHandlers.updateJob)
    .openapi(ImportJobRoutes.deleteJob, ImportJobHandlers.deleteJob)
    .openapi(ImportJobRoutes.bulkInsertParagraphs, ImportJobHandlers.bulkInsertParagraphs)
    .openapi(ImportJobRoutes.updateParagraph, ImportJobHandlers.updateParagraph)
    .openapi(ImportJobRoutes.deleteParagraph, ImportJobHandlers.deleteParagraph)
    .openapi(ImportJobRoutes.finalizeJob, ImportJobHandlers.finalizeJob);
