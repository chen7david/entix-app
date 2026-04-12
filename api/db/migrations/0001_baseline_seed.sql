-- 0001_baseline_seed.sql
-- Baseline seed data required for the app to function in all environments.
-- All inserts use INSERT OR IGNORE for idempotency.
-- DO NOT add environment-specific data here (no root admin, no test org).

-- 1. Platform Organization
INSERT OR IGNORE INTO `auth_organizations` (`id`, `name`, `slug`, `created_at`)
VALUES ('platform', 'Platform', 'platform', (cast(unixepoch() * 1000 as integer)));

-- 2. Financial Currencies
INSERT OR IGNORE INTO `financial_currencies` (`id`, `code`, `name`, `symbol`, `default_account_name`, `created_at`)
VALUES 
  ('fcur_usd', 'USD', 'US Dollar', '$', 'Savings (USD)', (cast(unixepoch() * 1000 as integer))),
  ('fcur_cny', 'CNY', 'Chinese Yuan', '¥', 'Savings (CNY)', (cast(unixepoch() * 1000 as integer))),
  ('fcur_etd', 'ETD', 'Entix Dollar', 'E$', 'Points (ETD)', (cast(unixepoch() * 1000 as integer))),
  ('fcur_cad', 'CAD', 'Canadian Dollar', 'CA$', 'Savings (CAD)', (cast(unixepoch() * 1000 as integer))),
  ('fcur_eur', 'EUR', 'Euro', '€', 'Savings (EUR)', (cast(unixepoch() * 1000 as integer))),
  ('fcur_srd', 'SRD', 'Surinamese Dollar', '$', 'Savings (SRD)', (cast(unixepoch() * 1000 as integer))),
  ('fcur_aud', 'AUD', 'Australian Dollar', 'A$', 'Savings (AUD)', (cast(unixepoch() * 1000 as integer)));

-- 3. Financial Transaction Categories
INSERT OR IGNORE INTO `financial_transaction_categories` (`id`, `name`, `is_expense`, `is_revenue`, `created_at`)
VALUES 
  ('fcat_cash_deposit', 'Cash Deposit', 0, 1, (cast(unixepoch() * 1000 as integer))),
  ('fcat_store_purchase', 'Store Purchase', 1, 0, (cast(unixepoch() * 1000 as integer))),
  ('fcat_service_fee', 'Service Fee', 1, 0, (cast(unixepoch() * 1000 as integer))),
  ('fcat_refund', 'Refund', 0, 0, (cast(unixepoch() * 1000 as integer))),
  ('fcat_internal_transfer', 'Internal Transfer', 0, 0, (cast(unixepoch() * 1000 as integer))),
  ('fcat_system_adjustment', 'System Adjustment', 0, 0, (cast(unixepoch() * 1000 as integer)));

-- 4. Social Media Types
INSERT OR IGNORE INTO `social_media_types` (`id`, `name`, `description`, `created_at`, `updated_at`)
VALUES 
  ('smt_wechat', 'WeChat', 'WeChat', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_whatsapp', 'WhatsApp', 'WhatsApp', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_telegram', 'Telegram', 'Telegram', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_discord', 'Discord', 'Discord', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_reddit', 'Reddit', 'Reddit', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_qq', 'QQ', 'QQ', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_github', 'GitHub', 'GitHub developer platform', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_linkedin', 'LinkedIn', 'Professional network', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_twitter', 'Twitter', 'Twitter / X', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_facebook', 'Facebook', 'Facebook social network', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_instagram', 'Instagram', 'Instagram photo sharing', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_youtube', 'YouTube', 'YouTube video platform', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_tiktok', 'TikTok', 'TikTok short-form video', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_website', 'Website', 'Personal or company website', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('smt_other', 'Other', 'Other', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer)));

-- 5. Platform Treasury Accounts (1,000,000 units = 100,000,000 cents)
INSERT OR IGNORE INTO `financial_accounts` (`id`, `owner_id`, `owner_type`, `currency_id`, `organization_id`, `name`, `balance_cents`, `overdraft_limit_cents`, `is_active`, `account_type`, `created_at`, `updated_at`)
VALUES 
  ('facc_treasury_fcur_usd', 'platform', 'org', 'fcur_usd', 'platform', 'Platform Treasury — USD', 100000000, 0, 1, 'treasury', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_treasury_fcur_etd', 'platform', 'org', 'fcur_etd', 'platform', 'Platform Treasury — ETD', 100000000, 0, 1, 'treasury', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_treasury_fcur_cad', 'platform', 'org', 'fcur_cad', 'platform', 'Platform Treasury — CAD', 100000000, 0, 1, 'treasury', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_treasury_fcur_cny', 'platform', 'org', 'fcur_cny', 'platform', 'Platform Treasury — CNY', 100000000, 0, 1, 'treasury', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_treasury_fcur_eur', 'platform', 'org', 'fcur_eur', 'platform', 'Platform Treasury — EUR', 100000000, 0, 1, 'treasury', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_treasury_fcur_srd', 'platform', 'org', 'fcur_srd', 'platform', 'Platform Treasury — SRD', 100000000, 0, 1, 'treasury', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_treasury_fcur_aud', 'platform', 'org', 'fcur_aud', 'platform', 'Platform Treasury — AUD', 100000000, 0, 1, 'treasury', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer)));

-- 6. System Adjustment Accounts (offset accounts with large float balance)
INSERT OR IGNORE INTO `financial_accounts` (`id`, `owner_id`, `owner_type`, `currency_id`, `organization_id`, `name`, `balance_cents`, `overdraft_limit_cents`, `is_active`, `account_type`, `created_at`, `updated_at`)
VALUES 
  ('facc_system_adjustment_fcur_usd', 'platform', 'org', 'fcur_usd', 'platform', 'System Adjustment — USD', 100000000000000, 0, 1, 'system', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_system_adjustment_fcur_etd', 'platform', 'org', 'fcur_etd', 'platform', 'System Adjustment — ETD', 100000000000000, 0, 1, 'system', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_system_adjustment_fcur_cad', 'platform', 'org', 'fcur_cad', 'platform', 'System Adjustment — CAD', 100000000000000, 0, 1, 'system', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_system_adjustment_fcur_cny', 'platform', 'org', 'fcur_cny', 'platform', 'System Adjustment — CNY', 100000000000000, 0, 1, 'system', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_system_adjustment_fcur_eur', 'platform', 'org', 'fcur_eur', 'platform', 'System Adjustment — EUR', 100000000000000, 0, 1, 'system', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_system_adjustment_fcur_srd', 'platform', 'org', 'fcur_srd', 'platform', 'System Adjustment — SRD', 100000000000000, 0, 1, 'system', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer))),
  ('facc_system_adjustment_fcur_aud', 'platform', 'org', 'fcur_aud', 'platform', 'System Adjustment — AUD', 100000000000000, 0, 1, 'system', (cast(unixepoch() * 1000 as integer)), (cast(unixepoch() * 1000 as integer)));
