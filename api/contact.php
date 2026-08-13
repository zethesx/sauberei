<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const RECIPIENT = 'info@sauberei.eu';
const SENDER = 'Sauberei Website <info@sauberei.eu>';
const MAX_REQUEST_BYTES = 8192;
const MAX_MESSAGE_LENGTH = 4000;
const ALLOWED_SERVICES = [
    'Haushaltsreinigung',
    'Büroreinigung',
    'Grundreinigung',
    'Fensterreinigung',
    'Umzugsreinigung',
    'Etwas anderes',
];

function respond(int $status, bool $ok, string $message): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function lengthOf(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function stringField(array $payload, string $key, bool $required, int $maxLength): string
{
    $value = $payload[$key] ?? '';
    if (!is_string($value)) {
        respond(400, false, 'Die Anfrage enthält ungültige Angaben.');
    }

    $value = trim($value);
    if ($required && $value === '') {
        respond(400, false, 'Bitte fülle alle Pflichtfelder aus.');
    }
    if (lengthOf($value) > $maxLength) {
        respond(400, false, 'Eine Angabe ist zu lang.');
    }

    return $value;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Diese Adresse akzeptiert nur POST-Anfragen.');
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '', 2)[0]));
if ($contentType !== 'application/json') {
    respond(415, false, 'Ungültiges Anfrageformat.');
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength < 1 || $contentLength > MAX_REQUEST_BYTES) {
    respond(400, false, 'Die Anfrage ist ungültig oder zu groß.');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && $host !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = strtolower(explode(':', $host, 2)[0]);
    if (!is_string($originHost) || $originHost === '' || strtolower($originHost) !== $requestHost) {
        respond(403, false, 'Diese Anfrage ist nicht erlaubt.');
    }
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > MAX_REQUEST_BYTES) {
    respond(400, false, 'Die Anfrage ist ungültig oder zu groß.');
}

try {
    $payload = json_decode($rawBody, true, 16, JSON_THROW_ON_ERROR);
} catch (JsonException $exception) {
    respond(400, false, 'Die Anfrage enthält kein gültiges JSON.');
}

if (!is_array($payload)) {
    respond(400, false, 'Die Anfrage enthält ungültige Angaben.');
}

$allowedFields = ['name', 'email', 'service', 'message', 'consent', 'website'];
foreach ($payload as $key => $_value) {
    if (!is_string($key) || !in_array($key, $allowedFields, true)) {
        respond(400, false, 'Die Anfrage enthält ungültige Angaben.');
    }
}

$honeypot = stringField($payload, 'website', false, 120);
if ($honeypot !== '') {
    // Deliberately look successful to automated submissions without sending mail.
    respond(200, true, 'Danke! Deine Anfrage ist bei uns angekommen. Wir melden uns so schnell wie möglich.');
}

$name = stringField($payload, 'name', true, 120);
if (lengthOf($name) < 2) {
    respond(400, false, 'Bitte gib einen vollständigen Namen an.');
}

$email = stringField($payload, 'email', true, 254);
if (preg_match('/[\r\n]/', $email) || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(400, false, 'Bitte gib eine gültige E-Mail-Adresse an.');
}

$service = stringField($payload, 'service', true, 80);
if (!in_array($service, ALLOWED_SERVICES, true)) {
    respond(400, false, 'Bitte wähle eine gültige Reinigungsleistung aus.');
}

$message = stringField($payload, 'message', false, MAX_MESSAGE_LENGTH);
if (($payload['consent'] ?? false) !== true) {
    respond(400, false, 'Bitte bestätige die Datenschutzeinwilligung.');
}

$cleanMessage = str_replace(["\r\n", "\r"], "\n", $message);
date_default_timezone_set('Europe/Berlin');
$subjectText = 'Neue Anfrage über sauberei.eu - ' . $service;
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$body = "Neue Anfrage über die Sauberei Website\n\n"
    . "Name:\n{$name}\n\n"
    . "E-Mail:\n{$email}\n\n"
    . "Leistung:\n{$service}\n\n"
    . "Nachricht:\n" . ($cleanMessage !== '' ? $cleanMessage : '(Keine Nachricht angegeben)') . "\n\n"
    . "Datenschutz-Einwilligung:\nJa\n\n"
    . 'Zeitpunkt: ' . date('d.m.Y H:i') . " Europe/Berlin\n";

$headers = [
    'From: ' . SENDER,
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

if (!@mail(RECIPIENT, $subject, $body, implode("\r\n", $headers))) {
    respond(500, false, 'Das hat gerade nicht geklappt. Schreib uns alternativ direkt an info@sauberei.eu.');
}

respond(200, true, 'Danke! Deine Anfrage ist bei uns angekommen. Wir melden uns so schnell wie möglich.');