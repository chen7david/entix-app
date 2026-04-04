-- Custom SQL migration file, put your code below! --

INSERT OR IGNORE INTO `auth_organizations` (`id`, `name`, `slug`, `created_at`)
VALUES ('A6xj7krOIJ3n9uHiipspC', 'Test Org', 'testorg', (cast(unixepoch('subsecond') * 1000 as integer)));

INSERT OR IGNORE INTO `auth_users` (`id`, `xid`, `name`, `email`, `email_verified`, `role`, `created_at`, `updated_at`, `banned`)
VALUES ('TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK', 'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK', 'Root Admin', 'root@admin.com', 1, 'admin', (cast(unixepoch('subsecond') * 1000 as integer)), (cast(unixepoch('subsecond') * 1000 as integer)), 0);

INSERT OR IGNORE INTO `auth_accounts` (`id`, `account_id`, `provider_id`, `user_id`, `password`, `created_at`, `updated_at`)
VALUES ('AgQUkeQr8EQVxrJy02ypz7qCMpBWhslp', 'root@admin.com', 'credential', 'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK', '75d6de8e87453904bdb786b8ed47b057:5af447d3a01933ef579d8b64b7b65b100155be0a682304e7f1781394ee57d014c09ae644b0659de66d4022df1be32580c85df7f2256a22f51ea59d2373e22f29', (cast(unixepoch('subsecond') * 1000 as integer)), (cast(unixepoch('subsecond') * 1000 as integer)));

INSERT OR IGNORE INTO `auth_members` (`id`, `organization_id`, `user_id`, `role`, `created_at`)
VALUES ('E2QTyceWPwpj-n_1I5lyR', 'A6xj7krOIJ3n9uHiipspC', 'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK', 'owner', (cast(unixepoch('subsecond') * 1000 as integer)));