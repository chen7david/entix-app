import { createRouter } from "@api/lib/app.lib";
import { InvitationHandler } from "./invitation.handlers";
import { InvitationRoutes } from './invitation.routes';

export const invitationRoutes = createRouter()
    .openapi(InvitationRoutes.getInvitations, InvitationHandler.getInvitations)
    .openapi(InvitationRoutes.inviteMember, InvitationHandler.inviteMember)
    .openapi(InvitationRoutes.cancelInvitation, InvitationHandler.cancelInvitation);
