PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS team_room_owners (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_team_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO team_room_owners (user_id, first_team_id, created_at)
SELECT owner_user_id, id, created_at FROM teams;
