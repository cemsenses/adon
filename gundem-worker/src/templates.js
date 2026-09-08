// Server-rendered templates for /gundem. Turkish only. No client framework.

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toLocalTime(iso) {
  // Shift to UTC+3 so day/month are right regardless of Worker runtime tz.
  const d = new Date(iso);
  return new Date(d.getTime() + 3 * 60 * 60 * 1000);
}
export function fmtDate(iso) {
  const d = toLocalTime(iso);
  return `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function fmtDateLong(iso) {
  const d = toLocalTime(iso);
  return `${DAYS_TR[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function fmtDateShort(iso) {
  const d = toLocalTime(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
}

export function imgSrc(post, base = '') {
  return post.image_key ? `${base}/gundem/img/${encodeURIComponent(post.image_key)}` : null;
}

export function audioSrc(post, base = '') {
  return post.audio_key ? `${base}/gundem/audio/${encodeURIComponent(post.audio_key)}?v=3` : null;
}

// Turkish reading speed ~180 words/minute for body copy. Counted from the excerpt + body together,
// stripped of HTML tags, so every post gets this automatically without any manual input.
function readingTimeMinutes(post) {
  const text = `${post.excerpt || ''} ${post.body_html || ''}`.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function figure(post, { eager = false, sizes = '(max-width: 768px) 100vw, 920px' } = {}) {
  const src = imgSrc(post);
  const alt = esc(post.image_alt || post.title);
  if (!src) {
    return `<div class="g-img g-img--empty" role="img" aria-label="${alt}"><span>Görsel hazırlanıyor</span></div>`;
  }
  return `<img class="g-img" src="${src}" alt="${alt}" width="1600" height="900" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} sizes="${sizes}">`;
}

/* ------------------------------------------------------------------ */
/* Shared chrome                                                        */
/* ------------------------------------------------------------------ */

const CSS = `
:root{--g-max:1120px;--g-read:720px;--g-wide:920px}
body.gundem :where(a,button):focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.g-skip{position:absolute;left:-999px;top:8px;background:#fff;color:var(--black);padding:8px 12px;z-index:2000}
.g-skip:focus{left:12px}
/* Dark page head, same pattern as the site's inner pages */
.g-head{background:var(--black);color:var(--white);padding:calc(var(--nav-height) + 96px) 32px 72px;border-bottom:1px solid var(--border)}
.g-head-inner{max-width:var(--g-max);margin:0 auto}
.g-crumb{display:flex;flex-wrap:wrap;gap:0 4px;font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.5);margin:0 0 32px;padding:0;list-style:none}
.g-crumb li{display:inline-flex;align-items:center;min-height:24px}
.g-crumb li+li::before{content:"/";margin:0 12px;color:rgba(255,255,255,.25)}
.g-crumb a{color:rgba(255,255,255,.5);padding:6px 0;transition:color var(--fast)}
.g-crumb a:hover{color:var(--white)}
.g-crumb [aria-current]{color:rgba(255,255,255,.85);letter-spacing:.12em;text-transform:none;font-weight:500}
.g-head h1{font-family:var(--font-headline);font-weight:900;text-transform:uppercase;color:var(--white);letter-spacing:.04em;line-height:.9;margin:0}
.g-head--index h1{font-size:clamp(72px,12vw,180px);margin-left:-.04em}
.g-head--index .g-sub{display:grid;grid-template-columns:1fr auto;gap:16px 40px;align-items:end;margin-top:32px}
.g-head--index p{font-size:18px;line-height:1.6;color:rgba(255,255,255,.6);max-width:580px;margin:0}
.g-head--index time{font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.5);white-space:nowrap}
.g-head--post h1{font-size:clamp(36px,5.2vw,80px);max-width:18ch;text-wrap:balance}
.g-head--post .g-date{display:block;font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.5);margin:28px 0 0}
.g-share{display:flex;align-items:center;gap:18px;margin:48px auto 0;max-width:var(--g-read)}
.g-share-label{font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.g-share-icons{display:flex;gap:10px}
.g-share-icons a{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:50%;color:var(--black);transition:background .2s ease,color .2s ease,border-color .2s ease}
.g-share-icons a:hover{background:var(--black);color:var(--white);border-color:var(--black)}
.g-share-icons svg{width:18px;height:18px;display:block}
.g-head--post .g-readtime{font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:8px 0 0}
/* Listen player */
.g-listen{display:flex;align-items:center;gap:14px;margin:22px 0 0;padding:12px 18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);max-width:420px;position:relative;border-radius:4px}
.g-listen::before{content:'';position:absolute;inset:-1px;border-radius:inherit;padding:1.5px;background:conic-gradient(from var(--g-angle,0deg),transparent 0deg,var(--accent) 55deg,transparent 130deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .25s ease;animation:g-rotate 2.4s linear infinite;animation-play-state:paused;pointer-events:none}
.g-listen.playing::before{opacity:1;animation-play-state:running}
@property --g-angle{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes g-rotate{to{--g-angle:360deg}}
.g-listen-btn{flex:none;width:44px;height:44px;border-radius:50%;background:var(--accent);color:var(--white);display:flex;align-items:center;justify-content:center;transition:background .2s ease,transform .15s ease}
.g-listen-btn:hover{background:#ff5548}
.g-listen-btn:active{transform:scale(.94)}
.g-listen-btn svg{width:16px;height:16px;display:block}
.g-listen-btn .g-icon-pause{display:none}
.g-listen.playing .g-icon-play{display:none}
.g-listen.playing .g-icon-pause{display:block}
.g-listen-body{flex:1;min-width:0}
.g-listen-label{font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.55);margin:0 0 8px}
.g-listen-bar{position:relative;height:3px;background:rgba(255,255,255,.18);cursor:pointer;border-radius:2px}
.g-listen-fill{position:absolute;inset:0 auto 0 0;width:0%;background:var(--accent);border-radius:2px}
.g-listen-time{font-family:var(--font-body);font-size:11px;color:rgba(255,255,255,.45);margin-top:8px;font-variant-numeric:tabular-nums}
.g-listen-speed{flex:none;min-width:40px;height:28px;padding:0 8px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.05);color:rgba(255,255,255,.75);font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.03em;cursor:pointer;transition:background .15s ease,color .15s ease,border-color .15s ease}
.g-listen-speed:hover{background:rgba(255,255,255,.12);color:var(--white);border-color:rgba(255,255,255,.35)}
.g-head--post .g-excerpt{font-family:var(--font-serif);font-style:italic;font-size:22px;line-height:1.5;color:rgba(255,255,255,.7);max-width:640px;margin:24px 0 0}
/* White content */
.g-page{max-width:var(--g-max);margin:0 auto;padding:64px 32px 96px}
.g-img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;background:var(--card-bg)}
.g-img--empty{display:flex;align-items:center;justify-content:center;background:var(--card-bg);color:var(--muted);font-size:12px;letter-spacing:.15em;text-transform:uppercase}
.g-label{font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:12px;margin:0 0 24px}
.g-label::before{content:'';display:block;width:32px;height:1px;background:var(--muted)}
/* Lead story */
.g-lead{display:grid;grid-template-columns:7fr 5fr;gap:32px 48px;align-items:start;padding:0 0 48px;border-bottom:1px solid var(--border)}
.g-lead h2{font-family:var(--font-headline);font-weight:800;text-transform:uppercase;font-size:clamp(32px,3.8vw,52px);line-height:.95;letter-spacing:.01em;margin:0 0 16px;text-wrap:balance}
.g-lead h2 a,.g-row h3 a{color:var(--black);transition:color var(--fast)}
.g-lead h2 a:hover,.g-row h3 a:hover{color:var(--accent)}
.g-date{display:block;font-family:var(--font-body);font-size:11px;font-weight:600;letter-spacing:.25em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.g-lead p{font-size:16px;line-height:1.7;color:var(--muted);margin:0}
/* Row list */
.g-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:0 56px}
.g-cols--with-aside{grid-template-columns:minmax(0,1fr) 300px}
.g-row{display:grid;grid-template-columns:120px minmax(0,1fr) 220px;gap:24px 40px;padding:40px 0;border-bottom:1px solid var(--border);align-items:start}
.g-row .g-date{margin:6px 0 0}
.g-row h3{font-family:var(--font-headline);font-weight:800;text-transform:uppercase;font-size:28px;line-height:1;letter-spacing:.01em;margin:0 0 12px;text-wrap:balance}
.g-row p{margin:0;color:var(--muted);font-size:15px;line-height:1.7}
/* Aside: popular */
.g-aside{padding-top:40px}
.g-aside ol{list-style:none;margin:0;padding:0;counter-reset:pop}
.g-aside li{counter-increment:pop;display:grid;grid-template-columns:32px 1fr;gap:12px;padding:16px 0;border-bottom:1px solid var(--border)}
.g-aside li::before{content:"0" counter(pop);font-family:var(--font-headline);font-size:20px;color:var(--accent);line-height:1.2}
.g-aside a{color:var(--black);font-family:var(--font-headline);font-weight:800;text-transform:uppercase;font-size:20px;line-height:1.05;display:block;padding:2px 0;transition:color var(--fast)}
.g-aside a:hover{color:var(--accent)}
.g-aside small{display:block;color:var(--muted);font-size:12px;letter-spacing:.1em;margin-top:6px}
/* Article */
.g-figure{max-width:var(--g-wide);margin:-140px auto 56px;width:100%;position:relative;z-index:2}
.g-head-spacer{height:140px}
.g-figure figcaption{font-size:12px;letter-spacing:.05em;color:var(--muted);margin-top:12px}
.g-article{max-width:var(--g-read);margin:0 auto}
.g-body{font-size:17px;line-height:1.75;color:var(--black)}
.g-body p{margin:0 0 1.4em}
.g-body h2{font-family:var(--font-headline);font-weight:800;text-transform:uppercase;font-size:30px;line-height:1;letter-spacing:.01em;margin:2.2em 0 .7em}
.g-body h3{font-family:var(--font-body);font-weight:600;font-size:18px;margin:1.8em 0 .5em}
.g-body ul{list-style:disc}.g-body ol{list-style:decimal}
.g-body ul,.g-body ol{padding-left:1.3em;margin:0 0 1.4em}
.g-body li{margin-bottom:.45em}
.g-body blockquote{margin:2.2em 0;padding:0 0 0 24px;border-left:2px solid var(--accent);font-family:var(--font-serif);font-style:italic;font-size:24px;line-height:1.4;color:var(--black)}
.g-body a{color:var(--black);text-decoration:underline;text-decoration-color:var(--accent);text-underline-offset:4px;transition:color var(--fast)}
.g-body a:hover{color:var(--accent)}
.g-body img{max-width:100%;height:auto;display:block;margin:2em 0}
.g-body figure{margin:2em 0}
.g-body figcaption{font-size:12px;color:var(--muted);margin-top:8px}
.g-end{max-width:var(--g-read);margin:72px auto 0;border-top:1px solid var(--black)}
.g-next{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:24px;align-items:center;padding:28px 0;border-bottom:1px solid var(--border);color:var(--black)}
.g-next .g-label{margin-bottom:10px}
.g-next h2{font-family:var(--font-headline);font-weight:800;text-transform:uppercase;font-size:30px;line-height:1;margin:0;transition:color var(--fast)}
.g-next:hover h2{color:var(--accent)}
.g-older{padding:32px 0 0}
.g-older ul{list-style:none;margin:0;padding:0}
.g-older li{border-bottom:1px solid var(--border)}
.g-older li a{display:grid;grid-template-columns:120px minmax(0,1fr);gap:16px;padding:16px 0;color:var(--black);min-height:44px;align-items:baseline}
.g-older li a:hover span:last-child{color:var(--accent)}
.g-older .g-date{margin:0}
.g-older span:last-child{font-family:var(--font-headline);font-weight:800;text-transform:uppercase;font-size:20px;line-height:1.05;transition:color var(--fast)}
.g-all{display:inline-flex;align-items:center;white-space:nowrap;min-height:44px;margin-top:28px;font-family:var(--font-body);font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--white);background:var(--accent);border:1.5px solid var(--accent);padding:0 24px;transition:background .3s ease,border-color .3s ease}
.g-all:hover{background:#333333;border-color:#333333}
.g-empty{padding:64px 0;color:var(--muted);font-size:18px}
@media (max-width:1024px){.g-cols--with-aside{grid-template-columns:minmax(0,1fr)}.g-aside{border-top:1px solid var(--black);margin-top:8px}}
@media (max-width:768px){
  .g-head{padding:calc(var(--nav-height) + 64px) 20px 48px}
  .g-head--index .g-sub{grid-template-columns:1fr}
  .g-page{padding:48px 20px 64px}
  .g-lead{grid-template-columns:1fr;gap:20px;padding-bottom:32px}
  .g-row{grid-template-columns:1fr;gap:12px;padding:28px 0}
  .g-row .g-img{order:-1}
  .g-row .g-date{margin:0}
  .g-figure{margin-top:-64px}
  .g-head-spacer{height:64px}
  .g-next{grid-template-columns:1fr}
  .g-next .g-img{order:-1;max-width:320px}
  .g-older li a{grid-template-columns:1fr;gap:6px}
  .g-head--post .g-excerpt{font-size:19px}
  .g-listen{max-width:none}
  .g-body{font-size:16px}
}
@media (prefers-reduced-motion:reduce){body.gundem *{transition:none!important;animation:none!important}}
`;

// Nav and footer are copied from the site verbatim (paths made absolute). Do not restyle.
function nav(origin) {
  return `
<nav class="nav nav--dark" id="block-nav" data-cms-block="nav">
    <a href="${origin}/index.html" class="nav-logo"><img src="${origin}/media/beyaz.png" alt="ADON Studio" class="logo-default" style="height:22px;width:auto;display:block;"><img src="${origin}/media/logos/adon-ufak-logo.png" alt="ADON Studio" class="logo-scrolled" style="height:22px;width:auto;display:none;"></a>
    <div class="nav-links">
      <a href="${origin}/hakkimizda.html" id="nav-link-1">Hakkımızda</a>
      <a href="${origin}/cozumler.html" id="nav-link-2">Çözümler</a>
      <a href="${origin}/calismalar.html" id="nav-link-3">Çalışmalar</a>
      <a href="${origin}/sentez.html" id="nav-link-4">Sentez</a>
    </div>
    <div class="lang-toggle">
      <span class="lang-active">TR</span>
      <a href="${origin}/en/index.html" class="lang-link">EN</a>
    </div>
    <a href="${origin}/iletisim.html" class="nav-cta" id="nav-cta">İletişim</a>
    <button class="nav-menu-toggle" aria-label="Menü">
      <span></span><span></span><span></span>
    </button>
  </nav>`;
}

function footer(origin) {
  return `
<footer id="block-footer" data-cms-block="footer">
    <div class="footer-grid">
      <div>
        <div class="footer-logo"><img src="${origin}/media/beyaz.png" alt="ADON Studio" width="112" height="28" style="height: 28px; width: auto; display: block;"></div>
        <p class="footer-tagline" id="footer-tagline">
          İşte yeni standart: İnsan zanaatını yapay zeka orkestrasyonuyla birleştiren ve dönüşümü ölçeklendirerek
          gerçeğe dönüştüren stratejik bir partner. Dönüşüme var mısınız?
        </p>
        <div style="margin-top: 24px; display: flex; gap: 16px;">
          <a href="https://www.instagram.com/adon.studio/" target="_blank" rel="noopener noreferrer"
            style="color: rgba(255,255,255,0.6); font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;">Instagram</a>
          <a href="https://www.linkedin.com/company/adon-studio/" target="_blank" rel="noopener noreferrer"
            style="color: rgba(255,255,255,0.6); font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;">LinkedIn</a>
          <a href="https://www.youtube.com/@ADON-AI-Studio" target="_blank" rel="noopener noreferrer"
            style="color: rgba(255,255,255,0.6); font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;">Youtube</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">Hızlı Bağlantılar</div>
        <div class="footer-links">
          <a href="${origin}/index.html">Ana Sayfa</a>
          <a href="${origin}/hakkimizda.html">Hakkımızda</a>
          <a href="${origin}/cozumler.html">Çözümler</a>
          <a href="${origin}/calismalar.html">Çalışmalar</a>
          <a href="${origin}/sentez.html">Sentez</a>
          <a href="${origin}/iletisim.html">İletişim</a>
        </div>
      </div>
      <div>
        <div class="footer-col-title">İletişim</div>
        <div class="footer-links">
          <a href="mailto:info@adon.com.tr">info@adon.com.tr</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span id="footer-copyright">© 2026 ADON Studio. Tüm hakları saklıdır.</span>
    </div>
  </footer>`;
}

function shareIcons({ url, title }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const xUrl = `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  return `
<div class="g-share">
  <span class="g-share-label">Paylaş</span>
  <div class="g-share-icons">
    <a href="${xUrl}" target="_blank" rel="noopener noreferrer" aria-label="X'te paylaş" style="min-width:44px;min-height:44px">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </a>
    <a href="${liUrl}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn'de paylaş" style="min-width:44px;min-height:44px">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    </a>
  </div>
</div>`;
}

function listenPlayer(post) {  const src = audioSrc(post);
  if (!src) return '';
  return `
<div class="g-listen" data-audio-player>
  <audio preload="metadata" src="${src}"></audio>
  <button type="button" class="g-listen-btn" aria-label="Sesli dinle" style="min-width:40px;min-height:40px">
    <svg class="g-icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
    <svg class="g-icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
  </button>
  <div class="g-listen-body">
    <p class="g-listen-label">Sesli Dinle</p>
    <div class="g-listen-bar" role="slider" aria-label="Ses konumu" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><div class="g-listen-fill"></div></div>
    <div class="g-listen-time"><span data-cur>0:00</span> / <span data-dur>--:--</span></div>
  </div>
  <button type="button" class="g-listen-speed" data-speed aria-label="Oynatma hızı">1x</button>
</div>`;
}

const LISTEN_JS = `
(function(){
  function fmt(s){s=Math.floor(s||0);var m=Math.floor(s/60);var r=s%60;return m+':'+(r<10?'0':'')+r;}
  document.querySelectorAll('[data-audio-player]').forEach(function(el){
    var audio=el.querySelector('audio'),btn=el.querySelector('.g-listen-btn'),bar=el.querySelector('.g-listen-bar'),
        fill=el.querySelector('.g-listen-fill'),cur=el.querySelector('[data-cur]'),dur=el.querySelector('[data-dur]'),
        speedBtn=el.querySelector('[data-speed]');
    var speeds=[1,1.5,2],speedIdx=0;
    if(speedBtn){
      speedBtn.addEventListener('click',function(){
        speedIdx=(speedIdx+1)%speeds.length;
        var s=speeds[speedIdx];
        audio.playbackRate=s;
        speedBtn.textContent=(s+'x');
      });
    }
    function setProgress(){
      if(audio.duration){var pct=(audio.currentTime/audio.duration)*100;fill.style.width=pct+'%';bar.setAttribute('aria-valuenow',Math.round(pct));}
      cur.textContent=fmt(audio.currentTime);
    }
    audio.addEventListener('loadedmetadata',function(){dur.textContent=fmt(audio.duration);});
    audio.addEventListener('timeupdate',setProgress);
    audio.addEventListener('play',function(){el.classList.add('playing');});
    audio.addEventListener('pause',function(){el.classList.remove('playing');});
    audio.addEventListener('ended',function(){el.classList.remove('playing');fill.style.width='0%';});
    btn.addEventListener('click',function(){audio.paused?audio.play():audio.pause();});
    function seek(clientX){
      var r=bar.getBoundingClientRect();var pct=Math.min(1,Math.max(0,(clientX-r.left)/r.width));
      if(audio.duration)audio.currentTime=pct*audio.duration;
      setProgress();
    }
    bar.addEventListener('click',function(e){seek(e.clientX);});
    bar.addEventListener('keydown',function(e){
      if(!audio.duration)return;
      if(e.key==='ArrowRight'){audio.currentTime=Math.min(audio.duration,audio.currentTime+5);}
      else if(e.key==='ArrowLeft'){audio.currentTime=Math.max(0,audio.currentTime-5);}
      else return;
      setProgress();
    });
  });
})();
`;

export function layout({ origin, title, description, canonical, ogImage, ogType = 'website', jsonLd = [], body, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="index, follow">
<meta property="og:site_name" content="ADON Studio">
<meta property="og:locale" content="tr_TR">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="alternate" type="application/rss+xml" title="ADON Studio Gündem" href="${origin}/gundem/feed.xml">
<link rel="icon" href="${origin}/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${origin}/styles/main.css?v=4">
<style>${CSS}</style>
${jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
${extraHead}
</head>
<body class="gundem">
<a class="g-skip" href="#main-content">İçeriğe Geç</a>
<div class="cursor"></div>
<div class="cursor-follower"></div>
${nav(origin)}
<main id="main-content">
${body}
</main>
${footer(origin)}
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Draggable.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Observer.min.js"></script>
<script src="${origin}/js/main.js" defer></script>
<script>${LISTEN_JS}</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Index                                                                */
/* ------------------------------------------------------------------ */

function crumbs(items) {
  return `<nav aria-label="Sayfa yolu"><ol class="g-crumb">${items
    .map((it, i) =>
      i === items.length - 1
        ? `<li aria-current="page">${esc(it.label)}</li>`
        : `<li><a href="${esc(it.href)}">${esc(it.label)}</a></li>`
    )
    .join('')}</ol></nav>`;
}

export function renderIndex({ origin, posts, popular = [], now = new Date().toISOString() }) {
  const [lead, ...rest] = posts;
  const withAside = popular.length >= 3;

  const leadHtml = lead
    ? `<section class="g-lead" aria-labelledby="g-lead-title">
  <a class="g-lead-img" href="/gundem/${esc(lead.slug)}" aria-hidden="true" tabindex="-1">${figure(lead, { eager: true, sizes: '(max-width: 768px) 100vw, 640px' })}</a>
  <div>
    <p class="g-label">Son yazı</p>
    <h2 id="g-lead-title"><a href="/gundem/${esc(lead.slug)}">${esc(lead.title)}</a></h2>
    <time class="g-date" datetime="${esc(lead.published_at)}">${fmtDate(lead.published_at)}</time>
    <p>${esc(lead.excerpt)}</p>
  </div>
</section>`
    : `<p class="g-empty">Henüz yayınlanmış bir yazı yok.</p>`;

  const rows = rest
    .map(
      (p) => `<article class="g-row">
  <time class="g-date" datetime="${esc(p.published_at)}">${fmtDateShort(p.published_at)}</time>
  <div>
    <h3><a href="/gundem/${esc(p.slug)}">${esc(p.title)}</a></h3>
    <p>${esc(p.excerpt)}</p>
  </div>
  <a href="/gundem/${esc(p.slug)}" aria-hidden="true" tabindex="-1">${figure(p, { sizes: '(max-width: 768px) 100vw, 220px' })}</a>
</article>`
    )
    .join('\n');

  const aside = withAside
    ? `<aside class="g-aside" aria-labelledby="g-pop-title">
  <h2 id="g-pop-title" class="g-label">En çok okunanlar</h2>
  <ol>${popular
    .map(
      (p) => `<li><div><a href="/gundem/${esc(p.slug)}">${esc(p.title)}</a><small>${fmtDate(p.published_at)}</small></div></li>`
    )
    .join('')}</ol>
</aside>`
    : '';

  const body = `
<header class="g-head g-head--index">
  <div class="g-head-inner">
    ${crumbs([{ label: 'Ana Sayfa', href: `${origin}/index.html` }, { label: 'Gündem' }])}
    <h1>Gündem</h1>
    <div class="g-sub">
      <p>Adon Studio'dan notlar, gözlemler ve perde arkası. Yapay zeka destekli üretimin günlük pratiğinden.</p>
      <time datetime="${esc(now)}">${fmtDateLong(now)}</time>
    </div>
  </div>
</header>
<div class="g-page">
  ${leadHtml}
  <div class="g-cols${withAside ? ' g-cols--with-aside' : ''}">
    <div>${rows}</div>
    ${aside}
  </div>
</div>`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'ADON Studio Gündem',
      url: `${origin}/gundem/`,
      inLanguage: 'tr',
      publisher: { '@type': 'Organization', name: 'ADON Studio', url: origin },
      blogPost: posts.slice(0, 10).map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        url: `${origin}/gundem/${p.slug}`,
        datePublished: p.published_at,
        image: imgSrc(p, origin) || undefined,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Gündem', item: `${origin}/gundem/` },
      ],
    },
  ];

  return layout({
    origin,
    title: 'Gündem | ADON Studio',
    description: 'Adon Studio Gündem: yapay zeka destekli prodüksiyon üzerine notlar, gözlemler ve perde arkası.',
    canonical: `${origin}/gundem/`,
    ogImage: (lead && imgSrc(lead, origin)) || `${origin}/media/hero/adon-hakkimizda.jpg`,
    jsonLd,
    body,
  });
}

/* ------------------------------------------------------------------ */
/* Article                                                              */
/* ------------------------------------------------------------------ */

export function renderPost({ origin, post, next, older = [] }) {
  const url = `${origin}/gundem/${post.slug}`;
  const nextHtml = next
    ? `<a class="g-next" href="/gundem/${esc(next.slug)}">
  <div>
    <p class="g-label">${next.isNewer ? 'Sonraki yazı' : 'Önceki yazı'}</p>
    <h2>${esc(next.title)}</h2>
  </div>
  ${figure(next, { sizes: '(max-width: 768px) 320px, 180px' })}
</a>`
    : '';

  const olderHtml = older.length
    ? `<section class="g-older" aria-labelledby="g-older-title">
  <h2 id="g-older-title" class="g-label">Eski yazılardan</h2>
  <ul>${older
    .map(
      (p) => `<li><a href="/gundem/${esc(p.slug)}"><time class="g-date" datetime="${esc(p.published_at)}">${fmtDateShort(p.published_at)}</time><span>${esc(p.title)}</span></a></li>`
    )
    .join('')}</ul>
  <a class="g-all" href="/gundem/">Tüm yazılar</a>
</section>`
    : `<section class="g-older"><a class="g-all" href="/gundem/">Tüm yazılar</a></section>`;

  const body = `
<article>
  <header class="g-head g-head--post">
    <div class="g-head-inner">
      ${crumbs([{ label: 'Ana Sayfa', href: `${origin}/index.html` }, { label: 'Gündem', href: '/gundem/' }, { label: post.title }])}
      <h1>${esc(post.title)}</h1>
      <time class="g-date" datetime="${esc(post.published_at)}">${fmtDate(post.published_at)}</time>
      <p class="g-readtime">Okuma süresi: ${readingTimeMinutes(post)} dk</p>
      <p class="g-excerpt">${esc(post.excerpt)}</p>
      ${listenPlayer(post)}
      <div class="g-head-spacer" aria-hidden="true"></div>
    </div>
  </header>
  <div class="g-page">
    <figure class="g-figure">${figure(post, { eager: true })}${post.image_caption ? `<figcaption>${esc(post.image_caption)}</figcaption>` : ''}</figure>
    <div class="g-article g-body">${post.body_html}</div>
    ${shareIcons({ url, title: post.title })}
    <nav class="g-end" aria-label="Diğer yazılar">
      ${nextHtml}
      ${olderHtml}
    </nav>
  </div>
</article>`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.published_at,
      dateModified: post.updated_at || post.published_at,
      inLanguage: 'tr',
      image: imgSrc(post, origin) || undefined,
      author: { '@type': 'Organization', name: 'ADON Studio', url: origin },
      publisher: { '@type': 'Organization', name: 'ADON Studio', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/media/logos/adon-ufak-logo.png` } },
      mainEntityOfPage: url,
    },
    ...(audioSrc(post, origin)
      ? [{
          '@context': 'https://schema.org',
          '@type': 'AudioObject',
          name: `${post.title} — Sesli Dinle`,
          contentUrl: audioSrc(post, origin),
          encodingFormat: 'audio/mpeg',
          inLanguage: 'tr',
          about: url,
        }]
      : []),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Gündem', item: `${origin}/gundem/` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];

  return layout({
    origin,
    title: `${post.title} | Gündem | ADON Studio`,
    description: post.excerpt.length > 155 ? post.excerpt.slice(0, 152).trimEnd() + '...' : post.excerpt,
    canonical: url,
    ogImage: imgSrc(post, origin) || `${origin}/media/hero/adon-hakkimizda.jpg`,
    ogType: 'article',
    jsonLd,
    body,
    extraHead: `<meta property="article:published_time" content="${esc(post.published_at)}">`,
  });
}

export function renderNotFound({ origin }) {
  return layout({
    origin,
    title: 'Yazı bulunamadı | Gündem | ADON Studio',
    description: 'Aradığınız yazı bulunamadı.',
    canonical: `${origin}/gundem/`,
    ogImage: `${origin}/media/hero/adon-hakkimizda.jpg`,
    body: `<header class="g-head g-head--post"><div class="g-head-inner">${crumbs([{ label: 'Ana Sayfa', href: `${origin}/index.html` }, { label: 'Gündem', href: '/gundem/' }, { label: 'Bulunamadı' }])}<h1>Bu yazı burada değil.</h1><p class="g-excerpt">Bağlantı değişmiş ya da yazı yayından kaldırılmış olabilir.</p></div></header><div class="g-page"><a class="g-all" href="/gundem/">Tüm yazılar</a></div>`,
  });
}

export function renderFeed({ origin, posts }) {
  const items = posts
    .map(
      (p) => `<item>
<title>${esc(p.title)}</title>
<link>${origin}/gundem/${esc(p.slug)}</link>
<guid isPermaLink="true">${origin}/gundem/${esc(p.slug)}</guid>
<pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
<description>${esc(p.excerpt)}</description>
</item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>ADON Studio Gündem</title>
<link>${origin}/gundem/</link>
<description>Yapay zeka destekli prodüksiyon üzerine notlar, gözlemler ve perde arkası.</description>
<language>tr</language>
${items}
</channel></rss>`;
}
