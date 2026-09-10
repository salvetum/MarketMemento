<div align="center">

<img src="icon.svg" width="128" height="128" alt="MarketMemento logosu">

# MarketMemento

**Steam Topluluk Pazarı geçmişi için yerel çalışan CSV analiz aracı**

Pazar hareketlerini, oyunlarını ve FIFO sonuçlarını veriyi cihazından çıkarmadan incele.

<br>

[![Türkçe](https://img.shields.io/badge/README-Türkçe-1f6feb?style=for-the-badge)](README.md)
[![English](https://img.shields.io/badge/README-English-1f6feb?style=for-the-badge)](README_EN.md)

<br>

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA-67c1f5?style=flat-square)
![Yaklaşım](https://img.shields.io/badge/Yaklaşım-Local--first-57e6a5?style=flat-square)
![Arayüz](https://img.shields.io/badge/Arayüz-Türkçe%20%7C%20English-a684ff?style=flat-square)
![Testler](https://img.shields.io/badge/Testler-16%2F16%20başarılı-57e6a5?style=flat-square)
[![Lisans](https://img.shields.io/github/license/salvetum/MarketMemento?style=flat-square&label=Lisans)](LICENSE)

<br>

[🌐 Canlı Demo](https://salvetum.github.io/MarketMemento/)
&nbsp;•&nbsp;
[🚀 Yerel Çalıştırma](#yerel-calistirma)
&nbsp;•&nbsp;
[🧪 Örnek CSV](examples/sample-history.csv)
&nbsp;•&nbsp;
[📦 Üçüncü Taraf Lisansları](vendor/THIRD_PARTY_NOTICES.md)

</div>

---

## MarketMemento Nedir?

**MarketMemento**, Steam Topluluk Pazarı işlem geçmişini CSV dosyası üzerinden doğrudan tarayıcıda inceleyen kişisel bir yan projedir. Ayrıştırma, hesaplama ve saklama işlemleri kullanıcının tarayıcısında yapılır; CSV içeriği uygulama tarafından bir sunucuya gönderilmez.

> Bu proje boş zamanda geliştirilen kişisel bir deneme projesidir. Valve, Steam veya Steam Inventory Helper ile bağlantılı değildir.

## ✨ Özellikler

- Bir veya birden fazla CSV dosyasını birleştirme
- Tekrarlanan kayıtları ayıklama ve içe aktarma özeti
- Oyun, ürün ve tarih filtreleri
- FIFO yaklaşımıyla alış/satış eşleştirmesi
- Kalan envanter için son alış fiyatı bazlı piyasa değeri, gerçekleşmemiş ROI ve elde tutma süresi
- Desteklenen oyunlarda Steam Community Market canlı fiyatlarını deneme ve başarısız isteklerde güvenli fallback
- Satır bazında otomatik para birimi algılama ve günlük referans kuruyla dönüşüm
- Aylık hareket, oyun özeti ve yıllık karşılaştırma grafikleri
- Oyun bazlı alış, satış ve net nakit akışı karşılaştırma grafiği
- Gün ve saat bazlı aktivite ısı haritası
- Tabloları CSV veya JSON olarak dışa aktarma
- Analiz ekranını PNG veya PDF raporu olarak kaydetme
- Vite + React tabanlı uygulama kabuğu ve Nivo ile etkileşimli çizgi, pasta ve çubuk grafikleri
- IndexedDB üzerinde yerel saklama
- PWA kurulumu ve çevrimdışı kullanım
- Koyu/açık tema ile Türkçe/İngilizce arayüz

## 📥 CSV Dosyasını Edinme

MarketMemento'nun beklediği geçmiş dosyası, **Steam Inventory Helper** eklentisinin Steam Pazar Geçmişim sayfasına eklediği dışa aktarma düğmesiyle alınabilir.

| Adım | İşlem |
| --- | --- |
| 1 | [Steam Inventory Helper](https://chromewebstore.google.com/detail/steam-inventory-helper/cmeakgjggjdlcpncigglobpjbkabhmjl) eklentisinin güncel izinlerini ve yayıncısını inceleyerek kur. |
| 2 | Tarayıcıdan [Steam Topluluk Pazarı geçmişini](https://steamcommunity.com/market/#myhistory) aç. |
| 3 | Sayfada beliren `Export .CSV file` düğmesiyle geçmişi indir. |
| 4 | İndirdiğin bir veya daha fazla CSV dosyasını MarketMemento'ya bırak. |

Beklenen temel sütunlar:

```text
Market Name,Price in Cents,Type
```

Tarih ve grafik özellikleri için `Acted On`, oyun ayrımı için `Game Name` önerilir. Uygulamayı gerçek veri kullanmadan denemek için [anonim örnek CSV](examples/sample-history.csv) kullanılabilir.

## ⚠️ Güvenlik ve Gizlilik Notları

> [!WARNING]
> Steam Inventory Helper üçüncü taraf bir tarayıcı eklentisidir; Valve, Steam veya MarketMemento'ya ait değildir.

- Eklentiyi kurmadan önce güncel izinleri, yayıncıyı ve gizlilik politikasını inceleyin.
- Yalnızca resmî Chrome Web Mağazası bağlantısını kullanın.
- Steam şifrenizi hiçbir eklenti ekranına girmeyin.
- CSV alındıktan sonra eklentiyi devre dışı bırakmayı değerlendirin.
- CSV içeriği MarketMemento tarafından bir sunucuya gönderilmez.
- Kur dönüşümü kullanıldığında yalnızca seçilen para birimi kodları Frankfurter'a gönderilir; CSV içeriği paylaşılmaz.
- Veriler kullanım kolaylığı için tarayıcının IndexedDB alanında tutulabilir.
- Ortak bir cihaz kullanıyorsanız işiniz bittiğinde **Yeni dosya** seçeneğiyle kayıtlı veriyi temizleyin.

## 📊 Hesaplama Notları

- Gerçekleşmiş fark, satışları en eski eşleşen alışlarla eşleştiren **FIFO** yaklaşımıyla tahmin edilir.
- Ücret seçeneği, kullanıcının belirlediği oranı satış tutarından düşürür; resmî Steam ücret hesaplayıcısı değildir.
- Para birimi her satırın `Display Price` alanındaki kod veya simgeden otomatik algılanır; aynı dosyada USD ve TRY gibi farklı para birimleri bulunabilir. İşaretsiz satırlar için yedek CSV para birimi seçilebilir.
- Tutarlar Frankfurter'ın en güncel günlük referans kuruyla dönüştürülür; işlem tarihindeki tarihsel kur kullanılmaz.
- Eksik pazar geçmişi veya farklı para birimlerinin aynı dosyada bulunması sonuçları etkileyebilir.
- Gerçekleşmemiş kâr, kalan miktarın son alış fiyatı referans alınarak değerlenmesiyle tahmin edilir; canlı Steam piyasa fiyatı değildir.
- Envanter tablosu kalem bazında gerçekleşmemiş ROI ve ortalama elde tutma süresini gösterir.
- **Canlı fiyatları yenile** yalnızca desteklenen oyunlar için Steam Community Market `priceoverview` uç noktasını tarayıcıdan dener. CORS, rate limit veya ürün bulunamaması durumunda son alış fiyatı değerlemesi korunur; CSV içeriği harici bir sunucuya gönderilmez.

## 🧪 Testler

Çekirdek hesaplama testleri Node test runner, React akış testleri ise Vitest ve Testing Library ile çalışır:

```bash
npm test
npm run test:core
npm run test:ui
```
- PNG ve PDF çıktısı dashboard'un tamamını içerir; uzun PDF raporları otomatik olarak birden fazla A4 sayfasına bölünür.

<a id="yerel-calistirma"></a>

## 🛠️ Yerel Çalıştırma

### Gereksinimler

- Güncel bir Chromium, Firefox veya Safari tarayıcısı
- Node.js 18 veya üzeri

### Projeyi Başlatma

```bash
git clone https://github.com/salvetum/MarketMemento.git
cd MarketMemento
npm install
npm run dev
```

Ardından Vite'ın gösterdiği yerel adresi (varsayılan olarak
[http://localhost:5173](http://localhost:5173)) açın. Üretim paketini
oluşturmak ve yerel olarak önizlemek için:

```bash
npm run build
npm run preview
```

Vite geliştirme sunucusu PWA dosyalarını, IndexedDB'yi ve çevrimdışı önbelleği
test etmek için HTTP sunucusu sağlar. `index.html` dosyasını doğrudan açmak
artık desteklenen çalışma yolu değildir.

### Testler

```bash
npm test
```

Testler tarih ayrıştırma, tekrar ayıklama, ücret hesaplama ve FIFO eşleştirme davranışlarını kapsar.

## 🌐 GitHub Pages Üzerinde Yayınlama

`npm run build` komutu `dist/` klasöründe yayınlanabilir Vite çıktısı üretir.
GitHub Pages yapılandırmasında dağıtım klasörü olarak `dist/` kullanın veya
CI içinde bu klasörü Pages'e yükleyin. PWA dosyaları ve göreli yollar derleme
çıktısına dahil edilir.

## 📁 Proje Yapısı

```text
index.html              Ana HTML kabuğu ve PWA meta verileri
src/main.jsx            Vite giriş noktası
src/App.jsx             React ekranı, durum yönetimi ve özellik bileşenleri
src/services/           CSV, depolama ve pazar verisi servisleri
src/nivoCharts.jsx      React/Nivo grafik bileşenleri
styles.css              Glassmorphism tasarım ve responsive kurallar
core.js                 Tarih, tekrar ayıklama ve FIFO hesaplama çekirdeği
app.js                  Eski bağlantılar için boş uyumluluk yolu (UI React'te)
vite.config.js          Üretim çıktısına PWA ve vendor varlıklarını kopyalar
sw.js                   PWA ve çevrimdışı önbellek
manifest.webmanifest    PWA tanımı
examples/               Anonim örnek CSV
tests/                  Node.js testleri
vendor/                 Font, Bootstrap varlıkları ve lisans bildirimleri
```

## 📜 Lisans

Bu proje **MIT Lisansı** altında yayımlanmaktadır. Ayrıntılar için [`LICENSE`](LICENSE), npm ile paketlenen bağımlılıkların lisansları için [`vendor/THIRD_PARTY_NOTICES.md`](vendor/THIRD_PARTY_NOTICES.md) dosyasına bakabilirsiniz.

---

<div align="center">

MarketMemento kişisel ve local-first bir yan proje olarak geliştirilmektedir.

⭐ Projeyi faydalı bulduysanız GitHub'da yıldız bırakabilirsiniz.

</div>
