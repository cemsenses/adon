// Cloudflare Pages focused-service SEO deployment: 2026-09-15
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
  "cozumler/ai-destekli-gorsel-produksiyon/index.html",
  "cozumler/ai-destekli-video-produksiyon/index.html",
  "cozumler/hibrit-video-produksiyon/index.html",
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
  "gundem/index.html",
  "gundem/urun-fotografindan-yasam-tarzi-sahnesine/index.html",
  "gundem/yapay-zeka-ciktisi-neden-asla-ham-teslim-edilmez/index.html",
  "gundem/yapay-zekanin-hizindan-once-konusmamiz-gereken-yedi-risk/index.html",
  "hakkimizda/index.html",
  "hero-video.js",
  "home-video-project.css",
  "iletisim/index.html",
  "index.html",
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

const GENERATED_FILES = {"gundem/feed.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><feed xmlns=\"http://www.w3.org/2005/Atom\"><title>ADON Studio Gündem</title><link href=\"https://adon.com.tr/gundem/\"/><link href=\"https://adon.com.tr/gundem/feed.xml\" rel=\"self\"/><id>https://adon.com.tr/gundem/</id><updated>2026-09-15T09:00:00+03:00</updated><entry><title>Yapay zekânın hızından önce konuşmamız gereken yedi risk</title><link href=\"https://adon.com.tr/gundem/yapay-zekanin-hizindan-once-konusmamiz-gereken-yedi-risk/\"/><id>https://adon.com.tr/gundem/yapay-zekanin-hizindan-once-konusmamiz-gereken-yedi-risk/</id><updated>2026-09-15T09:00:00+03:00</updated><summary>Yapay zekâ üretimi hızlandırıyor, bunu her gün görüyoruz. Ama hızın bedelini de konuşmak gerekiyor: emeğin değer kaybı, gerçeği kanıtlama zorluğu, denet...</summary></entry><entry><title>GPT-6 Astra ve AGI sorusu: stüdyo üretimi için ilk izlenimler</title><link href=\"https://adon.com.tr/gundem/gpt-6-astra-studyo-uretimi-icin-ilk-izlenimler/\"/><id>https://adon.com.tr/gundem/gpt-6-astra-studyo-uretimi-icin-ilk-izlenimler/</id><updated>2026-09-07T09:00:00+03:00</updated><summary>OpenAI, GPT-6 Astra</summary></entry><entry><title>Bir markanın yirmi pazara aynı hafta çıkması nasıl mümkün oldu</title><link href=\"https://adon.com.tr/gundem/bir-markanin-yirmi-pazara-ayni-hafta-cikmasi/\"/><id>https://adon.com.tr/gundem/bir-markanin-yirmi-pazara-ayni-hafta-cikmasi/</id><updated>2026-08-28T09:00:00+03:00</updated><summary>Yirmi pazara aynı hafta çıkmanın sırrı çeviri değil, görselin ve videonun her pazar için yeniden üretilme hızıdır. Yapay zeka görsel ve video üretiminin...</summary></entry><entry><title>Yapay zeka çıktısı neden asla ham teslim edilmez</title><link href=\"https://adon.com.tr/gundem/yapay-zeka-ciktisi-neden-asla-ham-teslim-edilmez/\"/><id>https://adon.com.tr/gundem/yapay-zeka-ciktisi-neden-asla-ham-teslim-edilmez/</id><updated>2026-08-19T09:00:00+03:00</updated><summary>Bir görselin ya da videonun üretilmesiyle bir markaya ait olması arasında bir tur daha vardır. Görselde rötuş ve metin düzeltmenin, videoda kurgu ve ren...</summary></entry><entry><title>Ürün fotoğrafından yaşam tarzı sahnesine: tek çekim, sınırsız bağlam</title><link href=\"https://adon.com.tr/gundem/urun-fotografindan-yasam-tarzi-sahnesine/\"/><id>https://adon.com.tr/gundem/urun-fotografindan-yasam-tarzi-sahnesine/</id><updated>2026-08-10T09:00:00+03:00</updated><summary>E-ticaret markalarının en pahalı sorusu şudur: aynı ürünü kaç farklı hayatın içinde gösterebiliriz? Tek bir referans fotoğraftan yola çıkıp yüzlerce bağ...</summary></entry></feed>","llms-full.txt":"# ADON Studio\n\n> ADON Studio, markalar için yapay zeka destekli video, ürün görseli ve hibrit prodüksiyon hizmetleri sunan Türkiye merkezli yaratıcı prodüksiyon stüdyosudur. 30 yıllık strateji ve prodüksiyon birikimini insan yaratıcı yönetimi, AI orkestrasyonu, VFX, kurgu ve renk uzmanlığıyla birleştirir.\n\n## Temel hizmetler\n- [AI destekli video prodüksiyonu](https://adon.com.tr/cozumler/ai-destekli-video-produksiyon/): Reklam filmi, sinematik marka içeriği ve sosyal medya videosu.\n- [AI destekli görsel prodüksiyon](https://adon.com.tr/cozumler/ai-destekli-gorsel-produksiyon/): Profesyonel ürün çekimi, yapay zeka sahne üretimi, rötuş ve marka tutarlılığı.\n- [Hibrit prodüksiyon](https://adon.com.tr/cozumler/hibrit-video-produksiyon/): Gerçek çekim, yapay zeka üretimi, VFX ve post prodüksiyonun tek anlatıda birleşmesi.\n\n## Kanıt ve yöntem\n- [Çalışmalar](https://adon.com.tr/calismalar/): Rossmann, Beymen, Urban Care ve diğer marka projeleri.\n- [Sentez metodolojisi](https://adon.com.tr/sentez/): Stratejik analiz, insan-AI fikir geliştirme, etik üretim ve kalite sentezi.\n- [Hakkımızda](https://adon.com.tr/hakkimizda/): Ekip, yaklaşım ve 30 yıllık prodüksiyon birikimi.\n- [Gündem](https://adon.com.tr/gundem/): AI video, görsel üretim ve prodüksiyon pratiği üzerine yazılar.\n\n## İletişim\n- [Proje formu](https://adon.com.tr/iletisim/)\n- E-posta: info@adon.com.tr\n- Resmi site: https://adon.com.tr/\n\n## ADON Studio nasıl çalışır?\nADON Studio projeyi yalnızca bir yapay zeka aracına teslim etmez. Brief ve marka standartları analiz edilir; uygun modeller seçilir; yaratıcı yönetmenler üretimi denetler; uzman editörler, VFX sanatçıları ve renk uzmanları çıktıyı marka standardına taşır. Yapay zeka çıktıları ham hâliyle teslim edilmez.\n\n## Kimler için uygundur?\nE-ticaret ve perakende, moda ve yaşam tarzı, kozmetik, hızlı tüketim ürünleri, finans, yapı ve dekorasyon markaları için kampanya, ürün ve sosyal medya içerikleri üretir. Çoklu pazar ve yüksek içerik hacmi gereken projelerde hız ve tutarlılığa odaklanır.\n","llms.txt":"# ADON Studio\n\n> ADON Studio, markalar için yapay zeka destekli video, ürün görseli ve hibrit prodüksiyon hizmetleri sunan Türkiye merkezli yaratıcı prodüksiyon stüdyosudur. 30 yıllık strateji ve prodüksiyon birikimini insan yaratıcı yönetimi, AI orkestrasyonu, VFX, kurgu ve renk uzmanlığıyla birleştirir.\n\n## Temel hizmetler\n- [AI destekli video prodüksiyonu](https://adon.com.tr/cozumler/ai-destekli-video-produksiyon/): Reklam filmi, sinematik marka içeriği ve sosyal medya videosu.\n- [AI destekli görsel prodüksiyon](https://adon.com.tr/cozumler/ai-destekli-gorsel-produksiyon/): Profesyonel ürün çekimi, yapay zeka sahne üretimi, rötuş ve marka tutarlılığı.\n- [Hibrit prodüksiyon](https://adon.com.tr/cozumler/hibrit-video-produksiyon/): Gerçek çekim, yapay zeka üretimi, VFX ve post prodüksiyonun tek anlatıda birleşmesi.\n\n## Kanıt ve yöntem\n- [Çalışmalar](https://adon.com.tr/calismalar/): Rossmann, Beymen, Urban Care ve diğer marka projeleri.\n- [Sentez metodolojisi](https://adon.com.tr/sentez/): Stratejik analiz, insan-AI fikir geliştirme, etik üretim ve kalite sentezi.\n- [Hakkımızda](https://adon.com.tr/hakkimizda/): Ekip, yaklaşım ve 30 yıllık prodüksiyon birikimi.\n- [Gündem](https://adon.com.tr/gundem/): AI video, görsel üretim ve prodüksiyon pratiği üzerine yazılar.\n\n## İletişim\n- [Proje formu](https://adon.com.tr/iletisim/)\n- E-posta: info@adon.com.tr\n- Resmi site: https://adon.com.tr/\n"};

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
for (const [path, contents] of Object.entries(GENERATED_FILES)) {
  const target = join(OUTPUT_DIR, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
}
console.log(`ADON site snapshot ready: ${FILES.length + Object.keys(GENERATED_FILES).length + 1} files`);
