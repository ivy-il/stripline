<?php
/**
 * Contact form handler for the static build (PHP hosting, no Node). Same job as src/app/api/contact/route.node.ts:
 * forwards the lead to WordPress (stripline-headless /contact) with the shared secret, which stays on the server.
 * Without WordPress, mails the lead to contact_email. Settings: contact-config.php, written by tools/pack-static.mjs.
 */
header('Content-Type: application/json; charset=utf-8');

function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['error' => 'method not allowed']);

$config = is_file(__DIR__ . '/contact-config.php') ? require __DIR__ . '/contact-config.php' : [];
$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body) || empty($body['name']) || empty($body['email'])) reply(400, ['error' => 'missing fields']);
if (!empty($body['website'])) reply(200, ['ok' => true]); // honeypot

$field = fn(string $k, int $max) => mb_substr(trim((string) ($body[$k] ?? '')), 0, $max);
$lead = [
    'name'    => $field('name', 200),
    'email'   => $field('email', 200),
    'phone'   => $field('phone', 50),
    'role'    => $field('role', 100),
    'message' => $field('message', 4000),
    'product' => $field('product', 100),
];
if (!filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) reply(400, ['error' => 'bad email']);

$wp = rtrim($config['wp_api_url'] ?? '', '/');
if ($wp) {
    $ch = curl_init("$wp/contact");
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($lead),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'X-Stripline-Secret: ' . ($config['secret'] ?? '')],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
    ]);
    curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status < 200 || $status >= 300) reply(502, ['error' => 'wp failed']);
    reply(200, ['ok' => true]);
}

$to = $config['contact_email'] ?? '';
if (!$to) reply(500, ['error' => 'contact not configured']);
$text = "שם: {$lead['name']}\nאימייל: {$lead['email']}\nטלפון: {$lead['phone']}\nתפקיד: {$lead['role']}\nמוצר: {$lead['product']}\n\n{$lead['message']}";
$subject = '=?UTF-8?B?' . base64_encode('פנייה חדשה מאתר STRIPLINE: ' . $lead['name']) . '?=';
$headers = "Content-Type: text/plain; charset=UTF-8\r\nReply-To: {$lead['email']}";
if (!mail($to, $subject, $text, $headers)) reply(502, ['error' => 'mail failed']);
reply(200, ['ok' => true]);
