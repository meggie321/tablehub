ALTER TABLE users ADD COLUMN phone_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_hash_unique ON users(phone_hash);

CREATE TABLE IF NOT EXISTS sms_verifications (
  challenge_hash TEXT PRIMARY KEY,
  phone_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  proof_hash TEXT,
  ip_hash TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at INTEGER,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS sms_verifications_phone_created_idx ON sms_verifications(phone_hash, created_at);
CREATE INDEX IF NOT EXISTS sms_verifications_expiry_idx ON sms_verifications(expires_at);
