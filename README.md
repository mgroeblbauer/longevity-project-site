# longevity-project.de (Astro-Pilot)

Quelle der Texte ist der Obsidian-Vault (`Second Brain/Website/longevity-project.de`).

```bash
npm run sync    # Vault -> src/content/site, public/images
npm run dev     # sync + Entwicklungsserver (http://localhost:4321)
npm run build   # sync + statische Seite nach dist/
```

`npm run migrate` ist die einmalige WordPress-Migration und überschreibt Vault-Dateien. Nach der ersten Bearbeitung im Vault nicht mehr ausführen.


## Umzug auf Hostinger (Checkliste)

1. **Hostinger-Ordner** für `longevity-project.de` anlegen (Domain bei Hostinger, PHP aktiv) und einen FTP-Zugang erstellen.
2. **GitHub-Secrets** im Repo setzen: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`. Optional die Variable `FTP_DIR` (Standard `public_html/`).
3. **Brevo einrichten:** Liste anlegen, Double-Opt-in-Vorlage erstellen, API-Schlüssel erzeugen. Auf dem Server `api/config.example.php` nach `api/config.php` kopieren und ausfüllen (diese Datei liegt nie im Repo).
4. **Kontaktformular testen:** `api/kontakt.php` schickt an `info@themediapro.de`. Absender `formular@longevity-project.de` muss auf der Domain als E-Mail-Postfach oder Weiterleitung existieren (Zustellbarkeit).
5. **Variable `HOSTINGER_DEPLOY` = `true`** setzen. Dann lädt jeder Push zusätzlich nach Hostinger hoch.
6. **Umschalten:** DNS von `longevity-project.de` auf Hostinger zeigen lassen (WordPress dort vorher sichern), Variable `PUBLIC_NOINDEX` auf `false` setzen, neu bauen. Danach in der Search Console die neue Sitemap `/sitemap-index.xml` einreichen.
7. Alte WordPress-URLs: Weiterleitungen stehen in `public/.htaccess` (Kategorie, Autor, Feed, alte Sitemaps).
