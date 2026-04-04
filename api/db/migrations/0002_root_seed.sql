-- 0002_root_seed.sql
-- Root admin seed. Password: root123

INSERT OR IGNORE INTO `auth_organizations` (`id`, `name`, `slug`, `created_at`)
VALUES ('A6xj7krOIJ3n9uHiipspC', 'Test Org', 'testorg', (cast(unixepoch('subsecond') * 1000 as integer)));

INSERT OR IGNORE INTO `auth_users` (`id`, `xid`, `name`, `email`, `email_verified`, `role`, `created_at`, `updated_at`, `banned`)
VALUES (
  'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK',
  'TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK',
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
  '35e62983eaa0bd5008ec18eef12dc364:9f648ab2b80dd9b587441b4bfbca101f026d7d734fc7f72fab6f9be534913839ddc0421f3081891fed46fc448e73e106ca9c3f010e7aff25167abc196e9a824a',
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
