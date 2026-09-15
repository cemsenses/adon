// Cloudflare Pages SEO-GEO retry: 2026-09-15
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SOURCE_ORIGIN = "https://adon-fuel-studio.cemsenses.chatgpt.site";
const OUTPUT_DIR = "dist";
const FILES = [
  "app.js",
  "article-audio.js",
  "assets/about.webp",
  "assets/brands/01-beymen.jpg",
  "assets/brands/02-is-bankasi.jpg",
  "assets/brands/03-tekirdag-raki.jpg",
  "assets/brands/04-karcher.jpg",
  "assets/brands/05-filli-boya.jpg",
  "assets/brands/06-sok-market.jpg",
  "assets/brands/07-yatsan.jpg",
  "assets/brands/08-lastikpark.jpg",
  "assets/brands/09-urban-care.jpg",
  "assets/brands/10-pastel-kozmetik.jpg",
  "assets/brands/11-tresan.jpg",
  "assets/brands/12-imprime-perfume.jpg",
  "assets/brands/13-the-purest-solutions.jpg",
  "assets/collage/1175709535.jpg",
  "assets/collage/1175730877.jpg",
  "assets/collage/1175736459.jpg",
  "assets/collage/1198697441.jpg",
  "assets/collage/1211291148.jpg",
  "assets/collage/1218930778.jpg",
  "assets/img_1774109498643.webp",
  "assets/img_1774109791755.webp",
  "assets/img_1774109873643.webp",
  "assets/img_1774110359406.webp",
  "assets/img_1774110398749.webp",
  "assets/img_1774110425841.webp",
  "assets/img_1774110459473.webp",
  "assets/img_1774110663011.webp",
  "assets/instagram.svg",
  "assets/isana-donut-lipjelly.webp",
  "assets/isana-hydration-cream.webp",
  "assets/isana-magic-aura.webp",
  "assets/linkedin.svg",
  "assets/logo.png",
  "assets/rossmann_1774109277324.webp",
  "assets/sentez.webp",
  "assets/sentez/01-rossmann-isana-01.png",
  "assets/sentez/02-rossmann-isana-02.png",
  "assets/sentez/03-imprime-perfume-01.png",
  "assets/sentez/04-aqua-di-polo.png",
  "assets/team-0.webp",
  "assets/team-1.webp",
  "assets/team-2.webp",
  "assets/team-3.webp",
  "assets/team-4.webp",
  "assets/vimeo.svg",
  "assets/whatsapp.svg",
  "calismalar/beymen/index.html",
  "calismalar/hawaiian-tropic/index.html",
  "calismalar/imprime-perfume-beauty/index.html",
  "calismalar/imprime-perfume-bloom/index.html",
  "calismalar/imprime-perfume-collection/index.html",
  "calismalar/index.html",
  "calismalar/isana-donut-lip-jelly/index.html",
  "calismalar/isana-hydration-cream/index.html",
  "calismalar/isana-magic-aura/index.html",
  "calismalar/rossmann-lip-jelly/index.html",
  "calismalar/rossmann-party/index.html",
  "calismalar/the-purest-solutions/index.html",
  "calismalar/urban-care/index.html",
  "collage-video.css",
  "collage-video.js",
  "contact-form.js",
  "contact-success.css",
  "contact-success.js",
  "cozumler/index.html",
  "favicon-192.png",
  "favicon-32.png",
  "favicon.ico",
  "gallery.json",
  "gundem.css",
  "gundem/audio/bir-markanin-yirmi-pazara-ayni-hafta-cikmasi.mp3",
  "gundem/audio/gpt-6-astra-studyo-uretimi-icin-ilk-izlenimler.mp3",
  "gundem/audio/urun-fotografindan-yasam-tarzi-sahnesine.mp3",
  "gundem/audio/yapay-zeka-ciktisi-neden-asla-ham-teslim-edilmez.mp3",
  "gundem/audio/yapay-zekanin-hizindan-once-konusmamiz-gereken-yedi-risk.mp3",
  "gundem/bir-markanin-yirmi-pazara-ayni-hafta-cikmasi/index.html",
  "gundem/gpt-6-astra-studyo-uretimi-icin-ilk-izlenimler/index.html",
  "gundem/img/bir-markanin-yirmi-pazara-ayni-hafta-cikmasi.webp",
  "gundem/img/gpt-6-astra-studyo-uretimi-icin-ilk-izlenimler.webp",
  "gundem/img/urun-fotografindan-yasam-tarzi-sahnesine.webp",
  "gundem/img/yapay-zeka-ciktisi-neden-asla-ham-teslim-edilmez.webp",
  "gundem/img/yapay-zekanin-hizindan-once-konusmamiz-gereken-yedi-risk.webp",
  "gundem/index.html",\n  "gundem/feed.xml",
  "gundem/urun-fotografindan-yasam-tarzi-sahnesine/index.html",
  "gundem/yapay-zeka-ciktisi-neden-asla-ham-teslim-edilmez/index.html",
  "gundem/yapay-zekanin-hizindan-once-konusmamiz-gereken-yedi-risk/index.html",
  "hakkimizda/index.html",
  "hero-video.js",
  "home-video-project.css",
  "iletisim/index.html",
  "index.html",\n  "llms.txt",\n  "llms-full.txt",
  "motion.css",
  "motion.js",
  "robots.txt",
  "sentez-images.css",
  "sentez/index.html",
  "sitemap.xml",
  "style.css",
  "vendor/THREE-LICENSE.txt",
  "vendor/three.core.min.js",
  "vendor/three.module.min.js",
  "whatsapp-float.css"
];
const REDIRECTS = "/hakkimizda.html                     /hakkimizda/ 301\n/cozumler.html                       /cozumler/ 301\n/calismalar.html                     /calismalar/ 301\n/sentez.html                         /sentez/ 301\n/iletisim.html                       /iletisim/ 301\n/yapay-zeka-produksiyon-studyosu.html / 301\n/yapay-zeka-gorsel-uretimi.html      /cozumler/ 301\n/yapay-zeka-video-uretimi.html       /cozumler/ 301\n/hiz-ve-olcek.html                   /cozumler/ 301\n/lp-urun-gorseli.html                /cozumler/ 301\n/dijital-klon-basvuru.html           /iletisim/ 301\n/demo-tr.html                        / 301\n/demo-tr/*                           / 301\n/kozmetik/*                          /calismalar/ 301\n/jelly-baby/*                        /calismalar/ 301\n/adon-sunum/*                        / 301\n/genel-sunum/*                       / 301\n/en/                                / 301\n/en/index.html                      / 301\n/en/home                             / 301\n/en/home/                            / 301\n/en/about.html                      /hakkimizda/ 301\n/en/solutions.html                  /cozumler/ 301\n/en/works.html                      /calismalar/ 301\n/en/synthesis.html                  /sentez/ 301\n/en/contact.html                    /iletisim/ 301\n";

async function download(path, attempt = 1) {
  const response = await fetch(`${SOURCE_ORIGIN}/${path}`, {
    redirect: "follow",
    headers: { "User-Agent": "ADON-Cloudflare-Pages-Build/1.0" },
  });

  if (!response.ok) {
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, attempt * 750));
      return download(path, attempt + 1);
    }
    throw new Error(`Failed to download ${path}: HTTP ${response.status}`);
  }

  const target = join(OUTPUT_DIR, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  return path;
}

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const concurrency = 6;
for (let i = 0; i < FILES.length; i += concurrency) {
  const batch = FILES.slice(i, i + concurrency);
  await Promise.all(batch.map(path => download(path)));
  console.log(`Downloaded ${Math.min(i + concurrency, FILES.length)}/${FILES.length}`);
}

await writeFile(join(OUTPUT_DIR, "_redirects"), REDIRECTS, "utf8");
console.log(`ADON site snapshot ready: ${FILES.length + 1} files`);
