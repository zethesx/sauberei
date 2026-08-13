# Sauberei

Eine einseitige, animierte Website für eine lokale deutsche Reinigungsfirma. Die Seite ist frameworkfrei und nutzt HTML, CSS, Web Animations API sowie schlankes JavaScript.

## Voraussetzungen

- Node.js 22 oder neuer
- npm

## Lokal starten

```bash
npm install
npm run dev
```

Danach läuft die Website auf `http://localhost:4173`.

## Produktions-Build

```bash
npm run check
npm run build
npm run preview
```

`npm run build` erzeugt die statische Auslieferung in `dist/`. `npm run preview` bedient genau diesen Build lokal unter Port 4173.

## Deployment

Die öffentliche Website wird automatisch über GitHub Pages bereitgestellt:

```text
Push auf main → GitHub Actions → npm run build → dist/ → GitHub Pages → sauberei.eu
```

IONOS stellt Domain-, DNS- und E-Mail-Dienste bereit, ist aber kein PHP- oder Webhosting-Runtime für diese Website. Es gibt keine manuelle IONOS-ZIP-Auslieferung und keinen serverseitigen PHP-Endpunkt.

- **Install:** `npm ci`
- **Node.js:** 22 oder neuer
- **GitHub Pages Workflow:** `.github/workflows/deploy-pages.yml`

Es sind keine Build- oder Runtime-Umgebungsvariablen erforderlich.

## Projektstruktur

```text
assets/       Hero-Video, Poster, Fonts und Markenassets
config.js     Bearbeitbare Unternehmens-, Leistungs- und FAQ-Daten
styles.css    Gestaltung und Responsive-Regeln
script.js     Interaktionen, Navigation, Form- und Motion-Logik
build.mjs     Statischer Produktions-Build
server.mjs    Lokaler Dev-/Preview-Server
```

## Inhalte pflegen

- **Kontakt, Einsatzgebiet, Rechtliches, Formular-Endpunkt:** `config.js`: `business`
- **Leistungen:** `config.js`: `services`
- **FAQ:** `config.js`: `faqs`
- **Hero-Medium:** `assets/cleaning-hero.mp4`
- **Hero-Poster:** `assets/hero-poster.jpg`

Das Video muss ein stummes, querformatiges MP4 für eine Endlosschleife sein. Die Einbindung in `index.html` nutzt `autoplay`, `muted`, `loop`, `playsinline`, `preload="metadata"` und das Poster. Ursprungsmedien gehören lokal in `assets/source-media/`; dieser Ordner wird nicht veröffentlicht.

## Kontaktformular und Kontakt

Die öffentliche Kontaktadresse ist [info@sauberei.eu](mailto:info@sauberei.eu) und wird zentral über `business.email` in `config.js` gepflegt. Das Formular sendet JSON asynchron an den ebenfalls zentral konfigurierten Formspree-Endpunkt `https://formspree.io/f/xoealaay`. Erfolgreiche Einsendungen werden erst nach einer bestätigten JSON-Antwort zurückgesetzt; Fehler lassen die Eingaben stehen und zeigen den direkten E-Mail-Kontakt als Fallback.

Der versteckte `_gotcha`-Wert dient als Honeypot. Formspree ist der externe Dienst zur Verarbeitung der Formularübermittlungen. Vor dem Live-Betrieb sollte im Formspree-Konto die erlaubte Domain für das Formular auf `sauberei.eu` (und gegebenenfalls `www.sauberei.eu`) eingeschränkt werden.

## Rechtliches vor dem Launch ergänzen

- konkretes Einsatzgebiet
- vollständige Angaben zur verantwortlichen Stelle in `business.legal.controller` (Name und ladungsfähige Anschrift)
- ein rechtlich geprüftes Impressum mit den tatsächlichen Unternehmensdaten
- Datenschutz aktualisieren, sobald Hosting, Tracking oder Formularverarbeitung geändert werden

## Veröffentlichung prüfen

```bash
npm run check
npm run build
```

Vor dem Push sind `node_modules/`, `dist/`, lokale Screenshots, Originalmedien, interne Freigaben sowie `.env`-Dateien bewusst ausgeschlossen. Keine Datei im veröffentlichten Repository darf 25 MB erreichen.
