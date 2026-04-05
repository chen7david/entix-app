-- 0002_root_seed.sql
-- Root admin seed. Password: r00tme

INSERT OR IGNORE INTO `auth_organizations` (`id`, `name`, `slug`, `created_at`)
VALUES ('A6xj7krOIJ3n9uHiipspC', 'Test Org', 'testorg', (cast(unixepoch('subsecond') * 1000 as integer)));

INSERT OR IGNORE INTO `auth_users` (`id`, `xid`, `name`, `email`, `email_verified`, `role`, `created_at`, `updated_at`, `banned`)
VALUES (
  'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK',
  'ROOTADMIN',
  'Root Admin',
  'root@admin.com',
  1,
  'admin',
  (cast(unixepoch('subsecond') * 1000 as integer)),
  (cast(unixepoch('subsecond') * 1000 as integer)),
  0
);

INSERT OR IGNORE INTO `auth_accounts` (`id`, `account_id`, `provider_id`, `user_id`, `password`, `created_at`, `updated_at`)
VALUES (
  'AgQUkeQr8EQVxrJy02ypz7qCMpBWhslp',
  'root@admin.com',
  'credential',
  'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK',
  'cc2d5071f13d1f9e88de1fbc0af47530:d88750de3b087b92430198e8dea1e746d406da96c6a429c22c82edcdfeaad3ce06b82beda503d97e3fd0bff2e618be14f743b2d9fdd68cb5b52c2b9a686d858a',
  (cast(unixepoch('subsecond') * 1000 as integer)),
  (cast(unixepoch('subsecond') * 1000 as integer))
);

INSERT OR IGNORE INTO `auth_members` (`id`, `organization_id`, `user_id`, `role`, `created_at`)
VALUES (
  'E2QTyceWPwpj-n_1I5lyR',
  'A6xj7krOIJ3n9uHiipspC',
  'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK',
  'owner',
  (cast(unixepoch('subsecond') * 1000 as integer))
);
