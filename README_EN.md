<div align="center">

<img src="icon.svg" width="128" height="128" alt="MarketMemento logo">

# MarketMemento

**A local-first CSV analytics tool for Steam Community Market history**

Explore market activity, games, and FIFO results without sending your data away from your device.

<br>

[![Türkçe](https://img.shields.io/badge/README-Türkçe-1f6feb?style=for-the-badge)](README.md)
[![English](https://img.shields.io/badge/README-English-1f6feb?style=for-the-badge)](README_EN.md)

<br>

![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA-67c1f5?style=flat-square)
![Approach](https://img.shields.io/badge/Approach-Local--first-57e6a5?style=flat-square)
![Interface](https://img.shields.io/badge/Interface-Türkçe%20%7C%20English-a684ff?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-6%2F6%20passing-57e6a5?style=flat-square)
[![License](https://img.shields.io/github/license/salvetum/MarketMemento?style=flat-square&label=License)](LICENSE)

<br>

[🌐 Live Demo](https://salvetum.github.io/MarketMemento/)
&nbsp;•&nbsp;
[🚀 Run Locally](#run-locally)
&nbsp;•&nbsp;
[🧪 Sample CSV](examples/sample-history.csv)
&nbsp;•&nbsp;
[📦 Third-party Licenses](vendor/THIRD_PARTY_NOTICES.md)

</div>

---

## What Is MarketMemento?

**MarketMemento** is a personal side project that analyzes Steam Community Market transaction history from CSV files directly in the browser. Parsing, calculations, and storage happen in the user's browser; MarketMemento does not upload the CSV contents to a server.

> This is a personal experimental project built in spare time. It is not affiliated with Valve, Steam, or Steam Inventory Helper.

## ✨ Features

- Merge one or more CSV files
- Remove duplicate records and display an import summary
- Filter by game, item, and date
- Match purchases and sales using a FIFO approach
- Optional fee estimation and currency conversion using a daily reference rate
- Monthly activity, game summary, and year comparison charts
- Activity heatmap by day and hour
- Export tables as CSV or JSON
- Save the active analytics view as a PNG or PDF report
- Local persistence with IndexedDB
- PWA installation and offline support
- Dark/light themes with Turkish and English interfaces

## 📥 Getting the CSV File

The history file expected by MarketMemento can be downloaded through the export button that **Steam Inventory Helper** adds to the Steam Market History page.

| Step | Action |
| --- | --- |
| 1 | Review the current permissions and publisher, then install [Steam Inventory Helper](https://chromewebstore.google.com/detail/steam-inventory-helper/cmeakgjggjdlcpncigglobpjbkabhmjl). |
| 2 | Open your [Steam Community Market history](https://steamcommunity.com/market/#myhistory) in the browser. |
| 3 | Download the history using the `Export .CSV file` button added to the page. |
| 4 | Drop one or more downloaded CSV files into MarketMemento. |

Required base columns:

```text
Market Name,Price in Cents,Type
```

`Acted On` is recommended for dates and charts, while `Game Name` enables game-level breakdowns. You can also use the [anonymous sample CSV](examples/sample-history.csv) to try the app without real account data.

## ⚠️ Security and Privacy Notes

> [!WARNING]
> Steam Inventory Helper is a third-party browser extension and is not owned by Valve, Steam, or MarketMemento.

- Review the extension's current permissions, publisher, and privacy policy before installation.
- Install it only from the official Chrome Web Store page.
- Never enter your Steam password into an extension screen.
- Consider disabling the extension after exporting the CSV.
- MarketMemento does not send CSV contents to a server.
- When conversion is enabled, only the selected currency codes are sent to Frankfurter; CSV contents are never shared.
- Data may be stored in the browser's IndexedDB for convenience.
- On a shared device, use **New file** when finished to clear the saved dataset.

## 📊 Calculation Notes

- Realized difference is estimated with **FIFO**, matching sales against the oldest available purchases.
- The fee option subtracts a user-defined rate from sales and is not an official Steam fee calculator.
- CSV currency and display currency can be selected separately. Amounts use Frankfurter's latest daily reference rate rather than the historical rate from each transaction date.
- Incomplete history or mixed currencies in one dataset can affect the results.
- PNG and PDF reports include the analytics tab that is active at export time.

<a id="run-locally"></a>

## 🛠️ Run Locally

### Requirements

- A current Chromium, Firefox, or Safari browser
- Python 3 for the local HTTP server
- Node.js 18 or later for the test suite

### Start the Project

```bash
git clone https://github.com/salvetum/MarketMemento.git
cd MarketMemento
npm run serve
```

Then open [http://localhost:8000](http://localhost:8000).

> Basic analysis also works by opening `index.html` directly. PWA installation and offline caching require an HTTP server.

### Tests

```bash
npm test
```

The suite covers date parsing, duplicate removal, fee calculation, and FIFO matching behavior.

## 🌐 Publish with GitHub Pages

MarketMemento consists of static files and requires no build step.

1. Push the files to the repository's default branch.
2. Open `Settings > Pages`.
3. Select `Deploy from a branch` as the source.
4. Choose the default branch and the `/ (root)` directory, then save.

The `.nojekyll` file, relative asset paths, and PWA files are ready for GitHub Pages.

## 📁 Project Structure

```text
index.html              Main interface
styles.css              Glassmorphism design and responsive rules
core.js                 Date parsing, deduplication, and FIFO calculation core
app.js                  File handling, UI, charts, and local persistence
sw.js                   PWA and offline cache
manifest.webmanifest    PWA metadata
examples/               Anonymous sample CSV
tests/                  Node.js test suite
vendor/                 Local third-party libraries and licenses
```

## 📜 License

This project is distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details and [`vendor/THIRD_PARTY_NOTICES.md`](vendor/THIRD_PARTY_NOTICES.md) for bundled dependency licenses.

---

<div align="center">

MarketMemento is developed as a personal, local-first side project.

⭐ If you find it useful, consider leaving a star on GitHub.

</div>
