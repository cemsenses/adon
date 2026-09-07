# adon.com.tr/gundem

Gündem blogu. Worker `/gundem*` rotasında çalışır; yazılar D1'de, görseller ve ses R2'de, sitenin geri kalanı GitHub Pages'ta kalır.

## Sayfa şablonu (kilitli)

Ana sayfa ve iç sayfa düzeni sabit standarttır, yeni yazılarda yeniden tasarlanmaz: siyah üst bant + breadcrumb, başlık, tarih, otomatik okuma süresi, giriş paragrafı, isteğe bağlı "Sesli Dinle" oynatıcısı, 16:9 kapak görseli, gövde, X/LinkedIn paylaşım ikonları, sonraki yazı ve eski yazılar. Site header/footer birebir adon.com.tr'den kopya, değiştirilmez.

## Yayınlama iş akışı

1. Yazı metni (`content/posts/<slug>.json`: slug, title, excerpt, body_html, image_key, image_alt, published_at, status) ve 16:9 kapak görseli (`content/images/`, `image_key` ile eşleşen dosya adı) hazırlanır.
2. **Metin önce onaylanır.** Onaydan önce yayına alınmaz.
3. **Ses (Sesli Dinle) ayrı bir onay gerektirir.** Metin onayı sesi otomatik tetiklemez; ses yalnızca Cem ayrıca "sesi de üret" dediğinde üretilir (ElevenLabs, kendi hesabı ve seçtiği voice ID ile — voice ID `9Hlhs8vhmiUvbP4rTY7C`). Her seslendirmenin en başına, başlıktan önce, sabit şu cümle eklenir: **"Adon Stüdyo ile Gündem'e hoş geldiniz."** Üretilen dosya `content/audio/<slug>.mp3` olarak konur, JSON'da `audio_key` alanı `audio/<slug>.mp3` olarak ayarlanır.
4. Push edildiğinde GitHub Actions Worker'ı deploy eder ve içeriği D1/R2'ye senkronize eder (yazı, görsel, varsa ses). Repodan silinen yazı taslağa alınır, okunma sayısı korunur.

## Gerekli repo secret'ları (bir kez)

- `CLOUDFLARE_API_TOKEN`: Workers Scripts Edit, D1 Edit, Workers R2 Storage Edit, Account Settings Read, Workers Routes Edit, Zone Read
- `CLOUDFLARE_ACCOUNT_ID`

İlk çalıştırmada workflow D1 veritabanını ve R2 bucket'ını kendisi oluşturur.

## Ayarlar

`wrangler.toml` içindeki `POPULAR_MIN_VIEWS` 0 iken "En çok okunanlar" sütunu gizlidir; bir eşik verildiğinde o eşiği geçen en az 3 yazı olunca görünür.
