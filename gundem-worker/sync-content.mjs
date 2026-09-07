// Syncs content/posts/*.json into D1 and content/images/* into R2.
// Runs in GitHub Actions after every push; can also run locally with a Cloudflare token.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DB = 'adon-gundem';
const BUCKET = 'adon-gundem-images';
const q = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// 1. Posts -> upsert SQL
const files = readdirSync('content/posts').filter((f) => f.endsWith('.json'));
let sql = '';
for (const f of files) {
  const p = JSON.parse(readFileSync(`content/posts/${f}`, 'utf8'));
  if (!p.slug || !p.title || !p.excerpt || !p.body_html || !p.published_at) throw new Error(`eksik alan: ${f}`);
  sql += `INSERT INTO posts (slug,title,excerpt,body_html,image_key,image_alt,published_at,status) VALUES (${q(p.slug)},${q(p.title)},${q(p.excerpt)},${q(p.body_html)},${q(p.image_key)},${q(p.image_alt)},${q(p.published_at)},${q(p.status === 'draft' ? 'draft' : 'published')})
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, body_html=excluded.body_html, image_key=excluded.image_key, image_alt=excluded.image_alt, published_at=excluded.published_at, status=excluded.status, updated_at=datetime('now');\n`;
}
// Posts removed from the repo are unpublished, not deleted (views are kept).
const slugs = files.map((f) => q(f.replace(/\.json$/, ''))).join(',');
if (slugs) sql += `UPDATE posts SET status='draft' WHERE slug NOT IN (${slugs});\n`;
writeFileSync('.sync.sql', sql);
run(`npx wrangler d1 execute ${DB} --remote --yes --file=.sync.sql`);
console.log(`${files.length} yazı senkronize edildi`);

// 2. Images -> R2 (key = filename; only files referenced by a post's image_key are needed, but all are uploaded)
if (existsSync('content/images')) {
  const imgs = readdirSync('content/images').filter((f) => !f.startsWith('.'));
  for (const f of imgs) {
    const ct = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif' }[f.split('.').pop().toLowerCase()] || 'application/octet-stream';
    run(`npx wrangler r2 object put ${BUCKET}/${f} --file=content/images/${f} --content-type=${ct} --remote`);
  }
  console.log(`${imgs.length} görsel yüklendi`);
}
