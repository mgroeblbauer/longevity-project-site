<?php
// Newsletter-Anmeldung über Brevo mit Double-Opt-in. Der API-Schlüssel steht NUR in config.php auf dem Server.
declare(strict_types=1);
require __DIR__ . '/_helfer.php';

nur_post();
spam_pruefen('newsletter');

$email = zeile((string)($_POST['email'] ?? ''), 200);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    antwort(false, 'Bitte prüfe die E-Mail-Adresse.', 422);
}

$konfig = __DIR__ . '/config.php';
if (!is_file($konfig)) {
    antwort(false, 'Die Newsletter-Anmeldung ist noch nicht eingerichtet.', 503);
}
$c = require $konfig; // liefert: api_key, list_id, template_id, redirect_url

$daten = json_encode([
    'email' => $email,
    'includeListIds' => [(int)$c['list_id']],
    'templateId' => (int)$c['template_id'],
    'redirectionUrl' => $c['redirect_url'],
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $daten,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['accept: application/json', 'content-type: application/json', 'api-key: ' . $c['api_key']],
]);
curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

// 201/204 = Bestätigungsmail verschickt. Auch bei bereits angemeldeten Adressen gleiche Antwort (keine Adressabfrage möglich).
if ($code >= 200 && $code < 300) {
    antwort(true, 'Fast geschafft: Ich habe dir eine Bestätigungs-E-Mail geschickt. Bitte klicke dort auf den Link.');
}
antwort(false, 'Die Anmeldung hat leider nicht geklappt. Bitte versuche es später noch einmal.', 502);
