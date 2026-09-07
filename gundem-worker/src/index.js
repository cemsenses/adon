import { renderIndex, renderPost, renderNotFound, renderFeed } from './templates.js';

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|fetch|curl|wget|headless|lighthouse|pagespeed/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const html = (body, status = 200, extra = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...extra } });
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const PUBLIC_COLS = 'id, slug, title, excerpt, image_key, image_alt, audio_key, published_at, updated_at, views';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = env.SITE_ORIGIN || `${url.protocol}//${url.host}`;
    let path = url.pathname;

    // Canonical: /gundem -> /gundem/
    if (path === '/gundem') return Response.redirect(`${origin}/gundem/${url.search}`, 301);
    if (!path.startsWith('/gundem/')) return new Response('Not found', { status: 404 });
    path = path.slice('/gundem/'.length);

    try {
      // ---------- Public ----------
      if (request.method === 'GET' || request.method === 'HEAD') {
        if (path === '') return indexPage(env, origin);
        if (path === 'feed.xml') return feed(env, origin);
        if (path.startsWith('img/')) return image(env, request, decodeURIComponent(path.slice(4)));
        if (path.startsWith('audio/')) return audioFile(env, request, decodeURIComponent(path.slice(6)));
        if (path.startsWith('api/')) return api(request, env, origin, path.slice(4));
        // Strip an accidental trailing slash on article URLs
        if (path.endsWith('/')) return Response.redirect(`${origin}/gundem/${path.slice(0, -1)}`, 301);
        if (SLUG_RE.test(path)) return postPage(env, ctx, request, origin, path);
        return html(renderNotFound({ origin }), 404);
      }
      if (path.startsWith('api/')) return api(request, env, origin, path.slice(4));
      return new Response('Method not allowed', { status: 405 });
    } catch (err) {
      console.error(err);
      return html(`<!doctype html><meta charset="utf-8"><title>Hata</title><p style="font:16px/1.5 sans-serif;padding:40px">Geçici bir sorun oluştu. Lütfen biraz sonra yeniden deneyin.</p>`, 500);
    }
  },
};

/* ---------------------------------------------------------------- */
/* Pages                                                              */
/* ---------------------------------------------------------------- */

async function indexPage(env, origin) {
  const { results: posts } = await env.DB.prepare(
    `SELECT ${PUBLIC_COLS} FROM posts WHERE status='published' ORDER BY published_at DESC LIMIT 100`
  ).all();

  let popular = [];
  const min = Number(env.POPULAR_MIN_VIEWS || 0);
  if (min > 0) {
    const r = await env.DB.prepare(
      `SELECT ${PUBLIC_COLS} FROM posts WHERE status='published' AND views >= ? ORDER BY views DESC LIMIT 5`
    )
      .bind(min)
      .all();
    popular = r.results;
  }

  return html(renderIndex({ origin, posts, popular }), 200, { 'cache-control': 'public, max-age=60' });
}

async function postPage(env, ctx, request, origin, slug) {
  const post = await env.DB.prepare(`SELECT * FROM posts WHERE slug=? AND status='published'`).bind(slug).first();
  if (!post) return html(renderNotFound({ origin }), 404);

  const [newer, olderRows] = await Promise.all([
    env.DB.prepare(
      `SELECT ${PUBLIC_COLS} FROM posts WHERE status='published' AND published_at > ? ORDER BY published_at ASC LIMIT 1`
    )
      .bind(post.published_at)
      .first(),
    env.DB.prepare(
      `SELECT ${PUBLIC_COLS} FROM posts WHERE status='published' AND published_at < ? ORDER BY published_at DESC LIMIT 4`
    )
      .bind(post.published_at)
      .all(),
  ]);

  const older = olderRows.results;
  // "Sonraki yazı" points to the next newer article; on the newest article fall back to the previous one.
  let next = null;
  let olderList = older;
  if (newer) next = { ...newer, isNewer: true };
  else if (older.length) {
    next = { ...older[0], isNewer: false };
    olderList = older.slice(1);
  }

  const ua = request.headers.get('user-agent') || '';
  if (request.method === 'GET' && !BOT_UA.test(ua)) {
    ctx.waitUntil(env.DB.prepare(`UPDATE posts SET views = views + 1 WHERE id=?`).bind(post.id).run());
  }

  return html(renderPost({ origin, post, next, older: olderList.slice(0, 3) }));
}

async function feed(env, origin) {
  const { results } = await env.DB.prepare(
    `SELECT ${PUBLIC_COLS} FROM posts WHERE status='published' ORDER BY published_at DESC LIMIT 30`
  ).all();
  return new Response(renderFeed({ origin, posts: results }), {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=600' },
  });
}

async function image(env, request, key) {
  if (!key || key.includes('..') || !env.IMAGES) return new Response('Not found', { status: 404 });
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  if (!headers.get('content-type')) headers.set('content-type', guessType(key));
  const res = new Response(obj.body, { headers });
  await cache.put(request, res.clone());
  return res;
}

function guessType(key) {
  const ext = key.split('.').pop().toLowerCase();
  return { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml' }[ext] || 'application/octet-stream';
}

async function audioFile(env, request, key) {
  if (!key || key.includes('..') || !env.IMAGES) return new Response('Not found', { status: 404 });
  const range = request.headers.get('range');
  const obj = await env.IMAGES.get(key, range ? { range: parseRange(range) } : undefined);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('accept-ranges', 'bytes');
  if (!headers.get('content-type')) headers.set('content-type', /\.mp3$/i.test(key) ? 'audio/mpeg' : 'application/octet-stream');
  if (obj.range && (obj.range.length !== obj.size || obj.range.offset)) {
    // Genuinely partial: never let a shared cache serve this slice to a different (or range-less) request.
    headers.set('cache-control', 'private, no-store');
    const end = obj.range.offset + obj.range.length - 1;
    headers.set('content-range', `bytes ${obj.range.offset}-${end}/${obj.size}`);
    headers.set('content-length', String(obj.range.length));
    return new Response(obj.body, { status: 206, headers });
  }
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('content-length', String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}

function parseRange(header) {
  const m = /^bytes=(\d+)-(\d*)$/.exec(header || '');
  if (!m) return undefined;
  const offset = Number(m[1]);
  const end = m[2] ? Number(m[2]) : undefined;
  return end !== undefined ? { offset, length: end - offset + 1 } : { offset };
}

/* ---------------------------------------------------------------- */
/* Admin API (Bearer ADMIN_TOKEN)                                     */
/*   GET    /gundem/api/posts            list (all statuses)          */
/*   GET    /gundem/api/posts/:slug      one                          */
/*   PUT    /gundem/api/posts/:slug      create or update (upsert)    */
/*   DELETE /gundem/api/posts/:slug                                   */
/*   PUT    /gundem/api/images/:key      upload raw bytes to R2       */
/*   DELETE /gundem/api/images/:key                                   */
/* ---------------------------------------------------------------- */

async function api(request, env, origin, sub) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'unauthorized' }, 401);

  const [resource, ...restParts] = sub.split('/');
  const id = decodeURIComponent(restParts.join('/'));
  const m = request.method;

  if (resource === 'posts') {
    if (m === 'GET' && !id) {
      const { results } = await env.DB.prepare(`SELECT ${PUBLIC_COLS}, status FROM posts ORDER BY published_at DESC`).all();
      return json(results);
    }
    if (!SLUG_RE.test(id)) return json({ error: 'invalid slug' }, 400);
    if (m === 'GET') {
      const p = await env.DB.prepare(`SELECT * FROM posts WHERE slug=?`).bind(id).first();
      return p ? json(p) : json({ error: 'not found' }, 404);
    }
    if (m === 'PUT') {
      const b = await request.json().catch(() => null);
      if (!b || !b.title || !b.excerpt || !b.body_html) return json({ error: 'title, excerpt, body_html required' }, 400);
      const published_at = b.published_at || new Date().toISOString();
      const status = b.status === 'draft' ? 'draft' : 'published';
      await env.DB.prepare(
        `INSERT INTO posts (slug, title, excerpt, body_html, image_key, image_alt, audio_key, published_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET
           title=excluded.title, excerpt=excluded.excerpt, body_html=excluded.body_html,
           image_key=excluded.image_key, image_alt=excluded.image_alt, audio_key=excluded.audio_key,
           published_at=excluded.published_at, status=excluded.status, updated_at=datetime('now')`
      )
        .bind(id, b.title, b.excerpt, b.body_html, b.image_key || null, b.image_alt || null, b.audio_key || null, published_at, status)
        .run();
      return json({ ok: true, url: `${origin}/gundem/${id}` });
    }
    if (m === 'DELETE') {
      await env.DB.prepare(`DELETE FROM posts WHERE slug=?`).bind(id).run();
      return json({ ok: true });
    }
  }

  if (resource === 'images') {
    if (!env.IMAGES) return json({ error: 'R2 binding missing' }, 503);
    if (!id || id.includes('..')) return json({ error: 'invalid key' }, 400);
    if (m === 'PUT') {
      const ct = request.headers.get('content-type') || guessType(id);
      await env.IMAGES.put(id, request.body, { httpMetadata: { contentType: ct } });
      return json({ ok: true, key: id, url: `${origin}/gundem/img/${encodeURIComponent(id)}` });
    }
    if (m === 'DELETE') {
      await env.IMAGES.delete(id);
      return json({ ok: true });
    }
  }

  if (resource === 'audio') {
    if (!env.IMAGES) return json({ error: 'R2 binding missing' }, 503);
    if (!id || id.includes('..')) return json({ error: 'invalid key' }, 400);
    if (m === 'PUT') {
      const ct = request.headers.get('content-type') || 'audio/mpeg';
      await env.IMAGES.put(id, request.body, { httpMetadata: { contentType: ct } });
      return json({ ok: true, key: id, url: `${origin}/gundem/audio/${encodeURIComponent(id)}` });
    }
    if (m === 'DELETE') {
      await env.IMAGES.delete(id);
      return json({ ok: true });
    }
  }

  return json({ error: 'not found' }, 404);
}
