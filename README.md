# 2pointmedia.ch – eigene Webseite

Gleiches Setup wie bei fast-recruiting: GitHub-Repo → Cloudflare Worker.

## Was wo liegt
- Jeder Push auf `main` wird von Cloudflare automatisch neu veröffentlicht.
- `public/` – die Webseite (Startseite, Impressum, Datenschutz, 404-Seite, Schriften)
- `src/worker.js` – nimmt das Anfrage-Formular entgegen und schickt dir jede Anfrage per E-Mail
- `wrangler.jsonc` – Einstellungen für Cloudflare

## Online stellen (einmalig)
1. Repo auf GitHub (erledigt: `2pointmedia`). Wichtig: `wrangler.jsonc`, `public/` und `src/` müssen direkt im
   Hauptverzeichnis des Repos liegen – nicht in einem Unterordner und nicht als ZIP. Sonst findet Cloudflare nichts.
2. Cloudflare → Workers & Pages → Erstellen → «Mit GitHub verbinden» → Repo wählen → Bereitstellen.
3. Formular aktivieren: Konto bei resend.com anlegen, Domain 2pointmedia.ch dort bestätigen, API-Schlüssel kopieren.
   In Cloudflare beim Worker unter Einstellungen → Variablen und Geheimnisse:
   - `RESEND_API_KEY` (als Geheimnis) = dein Resend-Schlüssel
   - `LEAD_FROM` = `2Point Media Webseite <anfrage@2pointmedia.ch>`
   - optional `LEAD_WEBHOOK` = Adresse deines Lead-Backends (z. B. das von fast-recruiting)
   Solange das fehlt, öffnet das Formular beim Besucher eine vorbereitete E-Mail – es geht also keine Anfrage verloren.
4. Testen über die workers.dev-Adresse. Wenn alles passt: unter «Domains» 2pointmedia.ch und www.2pointmedia.ch verbinden
   und bei Onepage die Domain entfernen.

## Noch zu erledigen
- Bilder liegen noch auf dem Onepage-Server (onecdn.io). Vor dem Kündigen von Onepage alle Bilder herunterladen,
  in `public/img/` legen und in `index.html` (Zeile mit `var CDN =`) auf `img/` umstellen.
- Logo: aktuell ein Text-Logo. Für das echte Logo die SVG-Datei in `public/img/` legen.
- Impressum: UID-Nummer ergänzen.
- Freigaben: Die Zahl «100 Bewerbungen / 80 qualifiziert» ist anonymisiert (Fensterbauer). Mit schriftlicher Freigabe von Fenster Nauer kann der Name rein.
- Meta-Pixel: Das Formular meldet bereits ein «Lead»-Ereignis, sobald ein Pixel eingebaut ist (dann Datenschutz ergänzen).
- Die alte Adresse /kontaktanfrage wird automatisch auf das neue Formular weitergeleitet.
