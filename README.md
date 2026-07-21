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
![Testler](https://img.shields.io/badge/Testler-6%2F6%20başarılı-57e6a5?style=flat-square)
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
- İsteğe bağlı ücret tahmini ve para birimi gösterimi
- Aylık hareket, oyun özeti ve yıllık karşılaştırma grafikleri
- Gün ve saat bazlı aktivite ısı haritası
- Tabloları CSV veya JSON olarak dışa aktarma
- Analiz ekranını PNG veya PDF raporu olarak kaydetme
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
- Veriler kullanım kolaylığı için tarayıcının IndexedDB alanında tutulabilir.
- Ortak bir cihaz kullanıyorsanız işiniz bittiğinde **Yeni dosya** seçeneğiyle kayıtlı veriyi temizleyin.

## 📊 Hesaplama Notları

- Gerçekleşmiş fark, satışları en eski eşleşen alışlarla eşleştiren **FIFO** yaklaşımıyla tahmin edilir.
- Ücret seçeneği, kullanıcının belirlediği oranı satış tutarından düşürür; resmî Steam ücret hesaplayıcısı değildir.
- Para birimi seçimi yalnızca gösterilen simgeyi değiştirir, kur dönüşümü yapmaz.
- Eksik pazar geçmişi veya farklı para birimlerinin aynı dosyada bulunması sonuçları etkileyebilir.
- PNG ve PDF çıktısı o anda açık olan analiz sekmesini içerir.

<a id="yerel-calistirma"></a>

## 🛠️ Yerel Çalıştırma

### Gereksinimler

- Güncel bir Chromium, Firefox veya Safari tarayıcısı
- Yerel HTTP sunucusu için Python 3
- Testleri çalıştırmak için Node.js 18 veya üzeri

### Projeyi Başlatma

```bash
git clone https://github.com/salvetum/MarketMemento.git
cd MarketMemento
npm run serve
```

Ardından [http://localhost:8000](http://localhost:8000) adresini açın.

> Temel analiz `index.html` doğrudan açılarak da kullanılabilir. PWA kurulumu ve çevrimdışı önbellek için HTTP sunucusu gerekir.

### Testler

```bash
npm test
```

Testler tarih ayrıştırma, tekrar ayıklama, ücret hesaplama ve FIFO eşleştirme davranışlarını kapsar.

## 🌐 GitHub Pages Üzerinde Yayınlama

Proje derleme gerektirmeyen statik dosyalardan oluşur.

1. Dosyaları GitHub deposunun ana dalına gönderin.
2. `Settings > Pages` bölümünü açın.
3. Kaynak olarak `Deploy from a branch` seçeneğini belirleyin.
4. Ana dalı ve `/ (root)` klasörünü seçerek kaydedin.

`.nojekyll`, göreli dosya yolları ve PWA dosyaları GitHub Pages kullanımı için hazırdır.

## 📁 Proje Yapısı

```text
index.html              Ana arayüz
styles.css              Glassmorphism tasarım ve responsive kurallar
core.js                 Tarih, tekrar ayıklama ve FIFO hesaplama çekirdeği
app.js                  Dosya okuma, arayüz, grafikler ve yerel depolama
sw.js                   PWA ve çevrimdışı önbellek
manifest.webmanifest    PWA tanımı
examples/               Anonim örnek CSV
tests/                  Node.js testleri
vendor/                 Yerel üçüncü taraf kütüphaneler ve lisanslar
```

## 📜 Lisans

Bu proje **MIT Lisansı** altında yayımlanmaktadır. Ayrıntılar için [`LICENSE`](LICENSE), yerel bağımlılıkların lisansları için [`vendor/THIRD_PARTY_NOTICES.md`](vendor/THIRD_PARTY_NOTICES.md) dosyasına bakabilirsiniz.

---

<div align="center">

MarketMemento kişisel ve local-first bir yan proje olarak geliştirilmektedir.

⭐ Projeyi faydalı bulduysanız GitHub'da yıldız bırakabilirsiniz.

</div>
