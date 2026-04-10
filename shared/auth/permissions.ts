import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

export const statement = {
    ...defaultStatements,
    organization: ["update", "delete"],
    invitation: ["create", "cancel"],
    member: ["read", "create", "update", "delete", "bulk-import", "bulk-export"],
    upload: ["read", "create", "update", "delete"],
    avatar: ["create", "update", "delete"],
    dashboard: ["read"],
    media: ["read", "create", "update", "delete"],
    "social-media-type": ["read", "create", "update", "delete"],
    "user-profile": ["read", "update"],
    schedule: ["read", "create", "update", "delete"],
    playlist: ["read", "create", "update", "delete"],
    // Education Resources
    course: ["read", "create", "update", "delete", "enroll", "unenroll"],
    assignment: ["read", "create", "update", "delete", "submit", "grade"],
    submission: ["read", "create", "update", "delete", "grade"],
    grade: ["read", "create", "update", "delete"],
    announcement: ["read", "create", "update", "delete"],
    attendance: ["read", "create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
    student: ac.newRole({
        member: ["read"],
        media: ["read"],
        "user-profile": ["read", "update"],
        schedule: ["read"],
        playlist: ["read"],
        course: ["read", "enroll", "unenroll"],
        assignment: ["read", "submit"],
        submission: ["read", "create", "update", "delete"],
        grade: ["read"],
        announcement: ["read"],
        attendance: ["read"],
    }),
    teacher: ac.newRole({
        member: ["read"],
        media: ["read", "create", "update", "delete"],
        "user-profile": ["read", "update"],
        schedule: ["read", "create", "update", "delete"],
        playlist: ["read", "create", "update", "delete"],
        course: ["read", "create", "update", "delete", "enroll", "unenroll"],
        assignment: ["read", "create", "update", "delete", "submit", "grade"],
        submission: ["read", "create", "update", "delete", "grade"],
        grade: ["read", "create", "update", "delete"],
        announcement: ["read", "create", "update", "delete"],
        attendance: ["read", "create", "update", "delete"],
    }),
    admin: ac.newRole({
        organization: ["update"],
        invitation: ["create", "cancel"],
        member: ["read", "create", "update", "delete", "bulk-import", "bulk-export"],
        upload: ["read", "create", "update", "delete"],
        avatar: ["create", "update", "delete"],
        dashboard: ["read"],
        media: ["read", "create", "update", "delete"],
        "social-media-type": ["read", "create", "update", "delete"],
        "user-profile": ["read", "update"],
        schedule: ["read", "create", "update", "delete"],
        playlist: ["read", "create", "update", "delete"],
        course: ["read", "create", "update", "delete", "enroll", "unenroll"],
        assignment: ["read", "create", "update", "delete", "submit", "grade"],
        submission: ["read", "create", "update", "delete", "grade"],
        grade: ["read", "create", "update", "delete"],
        announcement: ["read", "create", "update", "delete"],
        attendance: ["read", "create", "update", "delete"],
    }),
    owner: ac.newRole({
        organization: ["update", "delete"],
        invitation: ["create", "cancel"],
        member: ["read", "create", "update", "delete", "bulk-import", "bulk-export"],
        upload: ["read", "create", "update", "delete"],
        avatar: ["create", "update", "delete"],
        dashboard: ["read"],
        media: ["read", "create", "update", "delete"],
        "social-media-type": ["read", "create", "update", "delete"],
        "user-profile": ["read", "update"],
        schedule: ["read", "create", "update", "delete"],
        playlist: ["read", "create", "update", "delete"],
        course: ["read", "create", "update", "delete", "enroll", "unenroll"],
        assignment: ["read", "create", "update", "delete", "submit", "grade"],
        submission: ["read", "create", "update", "delete", "grade"],
        grade: ["read", "create", "update", "delete"],
        announcement: ["read", "create", "update", "delete"],
        attendance: ["read", "create", "update", "delete"],
    }),
};

export const { student, teacher, admin, owner } = roles;

/** Organization-level role. Derived from the `roles` object above. */
export type OrgRole = keyof typeof roles;
