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

Es sind keine Build- oder Runtime-Umgebungsvariablen erforderlich. Der Formularendpunkt wird serverseitig über IONOS PHP bereitgestellt; siehe unten.
## Projektstruktur

```text
assets/       Hero-Video und Poster
api/contact.php PHP-Endpunkt für den IONOS-Formularversand
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

Die öffentliche Kontaktadresse ist [info@sauberei.eu](mailto:info@sauberei.eu) und wird zentral über `business.email` in `config.js` gepflegt. Das Formular sendet JSON an den ebenfalls zentral konfigurierten Endpunkt `/api/contact.php`.

`api/contact.php` ist ein schlanker IONOS-PHP-Endpunkt. Er validiert die Eingaben serverseitig, nutzt einen Honeypot gegen automatisierte Einsendungen und übergibt E-Mails ausschließlich über `mail()` an `info@sauberei.eu`; der Absender bleibt `Sauberei Website <info@sauberei.eu>`, die Besucheradresse wird nur als `Reply-To` gesetzt. Es sind keine Zugangsdaten im Repository erforderlich.

Der Produktions-Build enthält den Endpunkt unter `dist/api/contact.php`. Für IONOS muss der komplette Inhalt von `dist/` in das Document Root der Domain geladen werden und PHP für diese Domain aktiviert sein. `npm run dev` und `npm run preview` führen PHP bewusst nicht aus und geben für den Endpunkt einen ehrlichen lokalen Hinweis zurück.

## Rechtliches vor dem Launch ergänzen

- konkretes Einsatzgebiet
- vollständige Angaben zur verantwortlichen Stelle in `business.legal.controller` (Name und ladungsfähige Anschrift)
- ein rechtlich geprüftes Impressum mit den tatsächlichen Unternehmensdaten
- Datenschutz aktualisieren, sobald Hosting, Tracking oder Formularverarbeitung geändert werden
- PHP-Ausführung und eine reale Zustellung an `info@sauberei.eu` nach dem IONOS-Upload prüfen

## Veröffentlichung prüfen

```bash
npm run check
npm run build
```

Vor dem Push sind `node_modules/`, `dist/`, lokale Screenshots, Originalmedien, interne Freigaben sowie `.env`-Dateien bewusst ausgeschlossen. Keine Datei im veröffentlichten Repository darf 25 MB erreichen.
