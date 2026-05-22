import { getPassageService } from "@api/factories/passage.factory";
import { toMs } from "@api/helpers/date.helpers";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { Passage, PassageImage, TextCollection } from "@shared/db/schema";
import type { PassageRoutes } from "./passage.routes";

/** List/detail metadata only — never includes inline body text (avoids large payloads). */
function mapPassageListItem(row: Passage) {
    return {
        id: row.id,
        organizationId: row.organizationId,
        collectionId: row.collectionId,
        title: row.title,
        type: row.type,
        cefrLevel: row.cefrLevel,
        bucketKey: row.bucketKey,
        r2Url: row.r2Url,
        pageNumber: row.pageNumber,
        wordCount: row.wordCount,
        createdAt: toMs(row.createdAt),
        updatedAt: toMs(row.updatedAt),
    };
}

function mapPassage(row: Passage & { content?: string | null }) {
    return {
        ...mapPassageListItem(row),
        content: row.content ?? null,
    };
}

function mapCollection(row: TextCollection) {
    return {
        id: row.id,
        organizationId: row.organizationId,
        title: row.title,
        author: row.author,
        description: row.description,
        type: row.type,
        cefrLevel: row.cefrLevel,
        bucketKey: row.bucketKey,
        r2Url: row.r2Url,
        totalPages: row.totalPages,
        createdAt: toMs(row.createdAt),
        updatedAt: toMs(row.updatedAt),
    };
}

function mapPassageImage(row: PassageImage) {
    return {
        id: row.id,
        passageId: row.passageId,
        uploadId: row.uploadId,
        imageUrl: row.imageUrl,
        altText: row.altText,
        caption: row.caption,
        position: row.position,
        sortOrder: row.sortOrder,
        createdAt: toMs(row.createdAt),
    };
}

export class PassageHandlers {
    static listPassages: AppHandler<typeof PassageRoutes.listPassages> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { limit, cursor, direction, collectionId, type, cefrLevel } = ctx.req.valid("query");
        const service = getPassageService(ctx);
        const result = await service.listPassages(organizationId, {
            limit,
            cursor,
            direction,
            collectionId,
            type,
            cefrLevel,
        });
        return ctx.json(
            {
                data: result.items.map((item) => mapPassageListItem(item)),
                nextCursor: result.nextCursor,
                prevCursor: result.prevCursor,
            },
            HttpStatusCodes.OK
        );
    };

    static createPassage: AppHandler<typeof PassageRoutes.createPassage> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const service = getPassageService(ctx);
        const item = await service.createPassage(organizationId, payload);
        return ctx.json({ data: mapPassage(item) }, HttpStatusCodes.CREATED);
    };

    static getPassage: AppHandler<typeof PassageRoutes.getPassage> = async (ctx) => {
        const { organizationId, passageId } = ctx.req.valid("param");
        const service = getPassageService(ctx);
        const { passage, content, images } = await service.getPassageContent(
            organizationId,
            passageId
        );
        return ctx.json(
            {
                data: {
                    ...mapPassage(passage),
                    content: content ?? null,
                    images: images.map(mapPassageImage),
                },
            },
            HttpStatusCodes.OK
        );
    };

    static updatePassage: AppHandler<typeof PassageRoutes.updatePassage> = async (ctx) => {
        const { organizationId, passageId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const service = getPassageService(ctx);
        const item = await service.updatePassage(organizationId, passageId, payload);
        return ctx.json({ data: mapPassage(item) }, HttpStatusCodes.OK);
    };

    static deletePassage: AppHandler<typeof PassageRoutes.deletePassage> = async (ctx) => {
        const { organizationId, passageId } = ctx.req.valid("param");
        const service = getPassageService(ctx);
        await service.deletePassage(organizationId, passageId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static listPassageImages: AppHandler<typeof PassageRoutes.listPassageImages> = async (ctx) => {
        const { organizationId, passageId } = ctx.req.valid("param");
        const service = getPassageService(ctx);
        const images = await service.listPassageImages(organizationId, passageId);
        return ctx.json({ data: images.map(mapPassageImage) }, HttpStatusCodes.OK);
    };

    static addPassageImage: AppHandler<typeof PassageRoutes.addPassageImage> = async (ctx) => {
        const { organizationId, passageId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const service = getPassageService(ctx);
        const image = await service.addPassageImage(organizationId, passageId, payload);
        return ctx.json({ data: mapPassageImage(image) }, HttpStatusCodes.CREATED);
    };

    static deletePassageImage: AppHandler<typeof PassageRoutes.deletePassageImage> = async (
        ctx
    ) => {
        const { organizationId, passageId, imageId } = ctx.req.valid("param");
        const service = getPassageService(ctx);
        await service.deletePassageImage(organizationId, passageId, imageId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };

    static listCollections: AppHandler<typeof PassageRoutes.listCollections> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const { limit, cursor, direction, type } = ctx.req.valid("query");
        const service = getPassageService(ctx);
        const result = await service.listCollections(organizationId, {
            limit,
            cursor,
            direction,
            type,
        });
        return ctx.json(
            {
                data: result.items.map(mapCollection),
                nextCursor: result.nextCursor,
                prevCursor: result.prevCursor,
            },
            HttpStatusCodes.OK
        );
    };

    static createCollection: AppHandler<typeof PassageRoutes.createCollection> = async (ctx) => {
        const { organizationId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const service = getPassageService(ctx);
        const item = await service.createCollection(organizationId, payload);
        return ctx.json({ data: mapCollection(item) }, HttpStatusCodes.CREATED);
    };

    static getCollection: AppHandler<typeof PassageRoutes.getCollection> = async (ctx) => {
        const { organizationId, collectionId } = ctx.req.valid("param");
        const service = getPassageService(ctx);
        const item = await service.getCollection(organizationId, collectionId);
        return ctx.json({ data: mapCollection(item) }, HttpStatusCodes.OK);
    };

    static updateCollection: AppHandler<typeof PassageRoutes.updateCollection> = async (ctx) => {
        const { organizationId, collectionId } = ctx.req.valid("param");
        const payload = ctx.req.valid("json");
        const service = getPassageService(ctx);
        const item = await service.updateCollection(organizationId, collectionId, payload);
        return ctx.json({ data: mapCollection(item) }, HttpStatusCodes.OK);
    };

    static deleteCollection: AppHandler<typeof PassageRoutes.deleteCollection> = async (ctx) => {
        const { organizationId, collectionId } = ctx.req.valid("param");
        const service = getPassageService(ctx);
        await service.deleteCollection(organizationId, collectionId);
        return ctx.body(null, HttpStatusCodes.NO_CONTENT);
    };
}
