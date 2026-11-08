<?php

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}

$name = basename($_GET['file'] ?? '');

if (!preg_match('/^receipt_[a-zA-Z0-9_-]+\\.(jpg|png|webp|gif|pdf)$/i', $name)) {
    http_response_code(404);
    exit;
}

$allowed = false;

if (!empty($_SESSION['receipt_uploads'][$name]) && time() - $_SESSION['receipt_uploads'][$name] <= 7200) {
    $allowed = true;
}

$pdo = get_db_connection();
$stmt = $pdo->prepare('SELECT group_id, receipt_url FROM expenses WHERE receipt_url LIKE ?');
$stmt->execute(['%' . $name . '%']);

while ($row = $stmt->fetch()) {
    $urls = json_decode($row['receipt_url'], true);

    if (!is_array($urls)) {
        $urls = [$row['receipt_url']];
    }

    foreach ($urls as $url) {
        if (basename(parse_url($url, PHP_URL_PATH) ?: '') === $name) {
            $member = $pdo->prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?');
            $member->execute([$row['group_id'], $_SESSION['user_id']]);

            if ($member->fetch()) {
                $allowed = true;
                break 2;
            }
        }
    }
}

if (!$allowed) {
    http_response_code(404);
    exit;
}

$path = __DIR__ . '/../storage/receipts/' . $name;

if (!is_file($path)) {
    http_response_code(404);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($path);
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

if (!in_array($mime, $allowedTypes, true)) {
    http_response_code(404);
    exit;
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($path));
header('Content-Disposition: inline; filename="' . $name . '"');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
readfile($path);
exit;
