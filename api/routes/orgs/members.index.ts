import { createRouter } from "@api/lib/app.lib";
import { MemberHandler } from "./member.handlers";
import { MemberRoutes } from './member.routes';

export const memberRoutes = createRouter()
    .openapi(MemberRoutes.createMember, MemberHandler.createMember);
