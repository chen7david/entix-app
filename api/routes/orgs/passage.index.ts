import { createRouter } from "@api/lib/app.lib";
import { PassageHandlers } from "./passage.handlers";
import { PassageRoutes } from "./passage.routes";

export const passageRoutes = createRouter()
    .openapi(PassageRoutes.listPassages, PassageHandlers.listPassages)
    .openapi(PassageRoutes.createPassage, PassageHandlers.createPassage)
    .openapi(PassageRoutes.getPassage, PassageHandlers.getPassage)
    .openapi(PassageRoutes.updatePassage, PassageHandlers.updatePassage)
    .openapi(PassageRoutes.deletePassage, PassageHandlers.deletePassage)
    .openapi(PassageRoutes.listPassageImages, PassageHandlers.listPassageImages)
    .openapi(PassageRoutes.addPassageImage, PassageHandlers.addPassageImage)
    .openapi(PassageRoutes.deletePassageImage, PassageHandlers.deletePassageImage)
    .openapi(PassageRoutes.listCollections, PassageHandlers.listCollections)
    .openapi(PassageRoutes.createCollection, PassageHandlers.createCollection)
    .openapi(PassageRoutes.getCollection, PassageHandlers.getCollection)
    .openapi(PassageRoutes.updateCollection, PassageHandlers.updateCollection)
    .openapi(PassageRoutes.deleteCollection, PassageHandlers.deleteCollection);
