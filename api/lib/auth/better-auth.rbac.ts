import { organization } from "better-auth/plugins";
import { ac, member, admin, owner } from "./better-auth.permissions";


export const orgRBAC = () => organization({
    ac,
    roles: {
        member,
        admin,
        owner,
    },
})