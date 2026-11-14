<?php
// Kontaktformular: schickt die Nachricht per E-Mail an den Betreiber.
declare(strict_types=1);
require __DIR__ . '/_helfer.php';

const EMPFAENGER = 'info@themediapro.de';
const ABSENDER = 'formular@longevity-project.de'; // muss eine Adresse der eigenen Domain sein (Zustellbarkeit)

nur_post();
spam_pruefen('kontakt');

$name = zeile((string)($_POST['name'] ?? ''), 100);
$email = zeile((string)($_POST['email'] ?? ''), 200);
$text = trim(mb_substr((string)($_POST['nachricht'] ?? ''), 0, 5000));

if ($name === '' || $text === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    antwort(false, 'Bitte fülle alle Felder aus und prüfe die E-Mail-Adresse.', 422);
}

$betreff = '=?UTF-8?B?' . base64_encode('Kontaktformular longevity-project.de: ' . $name) . '?=';
$koerper = "Name: $name\nE-Mail: $email\n\n$text\n";
$kopf = [
    'From: Longevity Project <' . ABSENDER . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: longevity-project-formular',
];
$ok = mail(EMPFAENGER, $betreff, $koerper, implode("\r\n", $kopf));
antwort($ok, $ok ? 'Danke für deine Nachricht. Ich melde mich so schnell wie möglich.' : 'Die Nachricht konnte nicht gesendet werden. Bitte schreib mir direkt an ' . EMPFAENGER . '.', $ok ? 200 : 500);
