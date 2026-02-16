-- Videos table for Bloom share
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Recording',
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  duration REAL,
  content_type TEXT NOT NULL DEFAULT 'video/mp4',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for listing videos by creation date
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
