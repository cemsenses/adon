const MAX_BYTES = 16384;
const mailbox = 'info@adon.com.tr';
const encode = value => btoa(String.fromCharCode(...new TextEncoder().encode(value)));

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (status, error) => new Response(JSON.stringify(error ? { ok: false, error } : { ok: true }), { status, headers });
    if (new URL(request.url).pathname !== '/api/contact') return reply(404, 'Bulunamadı.');
    if (!origin || !allowed.includes(origin)) return reply(403, 'Bu kaynaktan gönderim kabul edilmiyor.');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (request.method !== 'POST') return reply(405, 'POST kullanın.');
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply(415, 'JSON bekleniyor.');
    if (env.CONTACT_ENABLED !== 'true' || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN || !env.CONTACT_LIMITER) return reply(503, 'Form geçici olarak kullanılamıyor. info@adon.com.tr adresine yazabilirsiniz.');
    try {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return reply(403, 'İstek doğrulanamadı.');
      const limit = await env.CONTACT_LIMITER.limit({ key: `contact:${ip}` });
      if (!limit.success) return reply(429, 'Çok fazla deneme yaptınız. Bir dakika sonra tekrar deneyin.');
      const reader = request.body?.getReader();
      if (!reader) return reply(400, 'Form boş.');
      const chunks = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) { await reader.cancel(); return reply(413, 'Mesaj çok uzun.'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      let data;
      try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply(400, 'Form verisi okunamadı.'); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, 'Geçersiz form.');
      if (data.website) return reply(200); // Honeypot: no message is sent.
      const fields = { name: 120, email: 254, company: 200, solution: 120, message: 5000 };
      const form = {};
      for (const [key, max] of Object.entries(fields)) {
        if (data[key] != null && typeof data[key] !== 'string') return reply(400, 'Geçersiz alan.');
        form[key] = (data[key] || '').trim();
        if (form[key].length > max || (key !== 'message' && /[\r\n\x00]/.test(form[key]))) return reply(400, 'Geçersiz alan.');
      }
      if (!form.name || !form.message || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(form.email)) return reply(400, 'Ad, geçerli e-posta ve mesaj gereklidir.');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        body: new URLSearchParams({ grant_type: 'refresh_token', client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: env.GOOGLE_REFRESH_TOKEN })
      });
      if (!tokenResponse.ok) return reply(502, 'Gönderim tamamlanamadı. Lütfen daha sonra deneyin.');
      const token = await tokenResponse.json();
      if (!token.access_token) return reply(502, 'Gönderim tamamlanamadı.');
      const body = `Ad Soyad: ${form.name}\nŞirket: ${form.company}\nE-posta: ${form.email}\nÇözüm: ${form.solution}\n\n${form.message}`;
      const mime = [
        `From: ADON Studio <${mailbox}>`, `To: ${mailbox}`, `Reply-To: ${form.email}`,
        `Subject: =?UTF-8?B?${encode('ADON — Yeni proje talebi')}?=`,
        'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
        encode(body).match(/.{1,76}/g).join('\r\n')
      ].join('\r\n');
      const raw = encode(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const sent = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw })
      });
      if (!sent.ok) return reply(502, 'Gönderim tamamlanamadı. Lütfen daha sonra deneyin.');
      return reply(200);
    } catch {
      // Do not log submitted messages, email addresses or Google credentials.
      return reply(502, 'Gönderim durumu doğrulanamadı. Lütfen info@adon.com.tr adresinden iletişime geçin.');
    }
  }
};
