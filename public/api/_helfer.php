<?php
// Gemeinsame Hilfen für die Formular-Skripte (ohne Fremdanbieter, ohne Cookies).
declare(strict_types=1);

function wants_json(): bool {
    return isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json');
}

function antwort(bool $ok, string $message, int $status = 200): never {
    if (wants_json()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: /' . ($ok ? 'danke/' : 'fehler/') . '', true, 303);
    }
    exit;
}

function nur_post(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        antwort(false, 'Nur POST erlaubt.', 405);
    }
}

// Spam-Schutz ohne Fremdanbieter: Honeypot, Mindestzeit, einfache Begrenzung pro IP.
function spam_pruefen(string $name): void {
    if (trim((string)($_POST['website'] ?? '')) !== '') {
        antwort(true, 'Danke!'); // Bot: stillschweigend verwerfen
    }
    $ts = (int)($_POST['ts'] ?? 0) / 1000;
    $alter = time() - $ts;
    if ($ts <= 0 || $alter < 3 || $alter > 86400) {
        antwort(false, 'Bitte lade die Seite neu und sende das Formular erneut.', 400);
    }
    $datei = sys_get_temp_dir() . '/lp_' . $name . '_' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . date('YmdH'));
    $anzahl = is_file($datei) ? (int)file_get_contents($datei) : 0;
    if ($anzahl >= 5) {
        antwort(false, 'Zu viele Anfragen. Bitte versuche es später noch einmal.', 429);
    }
    file_put_contents($datei, (string)($anzahl + 1));
}

function zeile(string $s, int $max): string {
    $s = preg_replace('/[\r\n\t]+/', ' ', $s) ?? '';
    return mb_substr(trim($s), 0, $max);
}
