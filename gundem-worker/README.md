# adon.com.tr/gundem

Gündem blogu. Worker `/gundem*` rotasında çalışır; yazılar D1'de, görseller R2'de, sitenin geri kalanı GitHub Pages'ta kalır.

## Yayınlama

Her yazı `content/posts/<slug>.json` dosyasıdır (slug, title, excerpt, body_html, image_key, image_alt, published_at, status). 16:9 görsel `content/images/` altına konur ve JSON'daki `image_key` dosya adına eşitlenir. Push edildiğinde GitHub Actions Worker'ı deploy eder ve içeriği D1/R2'ye senkronize eder. Repodan silinen yazı taslağa alınır, okunma sayısı korunur.

## Gerekli repo secret'ları (bir kez)

- `CLOUDFLARE_API_TOKEN`: Workers Scripts Edit, D1 Edit, Workers R2 Storage Edit, Account Settings Read, Workers Routes Edit, Zone Read
- `CLOUDFLARE_ACCOUNT_ID`

İlk çalıştırmada workflow D1 veritabanını ve R2 bucket'ını kendisi oluşturur.

## Ayarlar

`wrangler.toml` içindeki `POPULAR_MIN_VIEWS` 0 iken "En çok okunanlar" sütunu gizlidir; bir eşik verildiğinde o eşiği geçen en az 3 yazı olunca görünür.
