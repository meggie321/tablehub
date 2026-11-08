DROP INDEX IF EXISTS users_phone_hash_unique;
DROP INDEX IF EXISTS sms_verifications_phone_created_idx;
DROP INDEX IF EXISTS sms_verifications_expiry_idx;
DROP TABLE IF EXISTS sms_verifications;
ALTER TABLE users DROP COLUMN phone_hash;
