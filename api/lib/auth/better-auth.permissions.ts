import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    project: ["create", "share", "update", "delete"],
    invitation: ["create", "cancel"],
} as const;

export const ac = createAccessControl(statement);

export const member = ac.newRole({
    project: ["create"],
});

export const admin = ac.newRole({
    project: ["create", "update"],
});

export const owner = ac.newRole({
    project: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
});