<?php
// Kopiere diese Datei auf dem Server nach config.php und trage die Werte aus Brevo ein.
// config.php gehört NICHT ins Git-Repository und wird beim Deploy nicht überschrieben.
return [
    'api_key' => 'HIER-BREVO-API-SCHLUESSEL',
    'list_id' => 0,          // Brevo: Kontakte > Listen > ID der Newsletter-Liste
    'template_id' => 0,      // Brevo: E-Mail-Vorlage für die Double-Opt-in-Bestätigung (muss den Bestätigungslink enthalten)
    'redirect_url' => 'https://longevity-project.de/danke/',
];
