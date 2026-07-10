import { createRouter } from "@api/lib/app.lib";
import { BulkMemberHandler } from "./bulk-member.handlers";
import { BulkMemberRoutes } from "./bulk-member.routes";
import { MemberHandler } from "./member.handlers";
import { MemberRoutes } from "./member.routes";

export const memberRoutes = createRouter()
    .openapi(MemberRoutes.createMember, MemberHandler.createMember)
    .openapi(BulkMemberRoutes.getMetrics, BulkMemberHandler.getMetrics)
    .openapi(BulkMemberRoutes.exportMembers, BulkMemberHandler.exportMembers)
    .openapi(BulkMemberRoutes.importMembers, BulkMemberHandler.importMembers);
