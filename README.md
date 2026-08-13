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

## Historische alternative Deployment-Konfiguration

Die versionierte [wrangler.jsonc](wrangler.jsonc) dokumentiert eine frühere optionale Static-Assets-Konfiguration mit `./dist` als einzigem Assets-Verzeichnis. Sie wird nicht für das aktuelle Live-Hosting verwendet: Die öffentliche Website wird bei IONOS gehostet. Das Repository-Root darf in keiner statischen Deployment-Konfiguration als Assets-Verzeichnis verwendet werden.

- **Install:** `npm ci`
- **Node.js:** 22 oder neuer

Es sind keine Build- oder Runtime-Umgebungsvariablen erforderlich. Eine spätere Formularintegration kann einen eigenen HTTPS-Endpunkt verwenden; siehe unten.
## Projektstruktur

```text
assets/       Hero-Video und Poster
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

Die öffentliche Kontaktadresse ist [info@sauberei.eu](mailto:info@sauberei.eu) und wird zentral über `business.email` in `config.js` gepflegt. Die Website bietet ausschließlich Kontakt per E-Mail.

Ohne `business.formEndpoint` wird keine erfolgreiche Übermittlung vorgetäuscht. Das Formular validiert lokal und zeigt offen an, dass noch kein Versanddienst verbunden ist. Sobald ein echter HTTPS-Endpunkt hinterlegt wird, sendet die Website JSON per POST; der Endpunkt muss CORS erlauben und mit einem 2xx-Status antworten.

## Rechtliches vor dem Launch ergänzen

- konkretes Einsatzgebiet
- vollständige Angaben zur verantwortlichen Stelle in `business.legal.controller` (Name und ladungsfähige Anschrift)
- ein rechtlich geprüftes Impressum mit den tatsächlichen Unternehmensdaten
- Datenschutz aktualisieren, sobald Hosting, Tracking oder `business.formEndpoint` geändert werden
- optional: `business.formEndpoint`

## Veröffentlichung prüfen

```bash
npm run check
npm run build
```

Vor dem Push sind `node_modules/`, `dist/`, lokale Screenshots, Originalmedien, interne Freigaben sowie `.env`-Dateien bewusst ausgeschlossen. Keine Datei im veröffentlichten Repository darf 25 MB erreichen.
