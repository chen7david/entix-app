import { createRouter } from "@api/lib/app.lib";
import { MemberHandler } from "./member.handlers";
import { MemberRoutes } from './member.routes';

export const memberRoutes = createRouter()
    .openapi(MemberRoutes.getMembers, MemberHandler.getMembers)
    .openapi(MemberRoutes.createMember, MemberHandler.createMember)
    .openapi(MemberRoutes.updateMemberRole, MemberHandler.updateMemberRole)
    .openapi(MemberRoutes.removeMember, MemberHandler.removeMember);
