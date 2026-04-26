-- ============================================================
-- 007 — At-rest encryption for Claude API keys + cleanup
--
-- Adds claude_api_key_encrypted (text) which holds AES-GCM-256 ciphertext
-- (base64-encoded). The encryption key lives only in the ENCRYPTION_KEY
-- Edge Function secret — never in the database.
--
-- The legacy claude_api_key (plaintext) column stays in place for
-- backward compatibility while existing users haven't yet re-saved their
-- key. Edge Function `claude-proxy` reads encrypted first, falls back to
-- plaintext. `save-api-key` writes the encrypted column and nulls out
-- the plaintext column on every save.
--
-- Also drops the leftover "Public read estimates by token" policy from
-- migration 002 — it was the same shape as the invoices/projects leak
-- closed in 006 but accidentally left behind.
-- ============================================================

-- Drop the over-permissive estimates policy from migration 002
drop policy if exists "Public read estimates by token" on estimates;

-- Add the encrypted column
alter table profiles
  add column if not exists claude_api_key_encrypted text;

-- Mark the legacy column for cleanup (no DROP yet — needs all users
-- to re-save first). When you're ready to remove plaintext entirely:
--   alter table profiles drop column claude_api_key;
comment on column profiles.claude_api_key is
  'DEPRECATED — plaintext key. Use claude_api_key_encrypted via the save-api-key Edge Function. Will be dropped after all users have re-saved their keys.';
comment on column profiles.claude_api_key_encrypted is
  'AES-GCM-256 ciphertext (base64). Encryption key lives only in the ENCRYPTION_KEY Edge Function secret. Decrypt via _shared/crypto.ts in Edge Functions.';
