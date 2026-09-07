CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  excerpt      TEXT    NOT NULL,           -- lead paragraph shown under the date and on the index
  body_html    TEXT    NOT NULL,           -- rest of the article as HTML (p, h2, h3, ul, ol, blockquote, a, strong, em)
  image_key    TEXT,                       -- R2 object key, served at /gundem/img/<key>
  image_alt    TEXT,
  audio_key    TEXT,                       -- R2 object key for the read-aloud MP3, served at /gundem/audio/<key>
  published_at TEXT    NOT NULL,           -- ISO 8601, e.g. 2026-09-07T09:00:00+03:00
  status       TEXT    NOT NULL DEFAULT 'published',  -- 'published' | 'draft'
  views        INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_views     ON posts (status, views DESC);
