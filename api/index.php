<?php

require_once __DIR__ . '/../config/session.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: same-origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

function json_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function get_request_data() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
            return $json;
        }
    }

    return $_POST ?: [];
}

function get_current_user_id() {
    if (!empty($_SESSION['user_id'])) {
        return (int)$_SESSION['user_id'];
    }
    return null;
}

function require_auth() {
    $user_id = get_current_user_id();
    if (!$user_id) {
        json_error('Unauthorized. Please log in.', 401);
    }
    return $user_id;
}

function is_valid_amount($value) {
    if (!is_scalar($value)) {
        return false;
    }

    $value = trim((string)$value);
    return preg_match('/^\d{1,10}(?:\.\d{1,2})?$/D', $value) === 1 && (float)$value > 0;
}

function is_valid_date($value) {
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
        return false;
    }

    return checkdate((int)substr($value, 5, 2), (int)substr($value, 8, 2), (int)substr($value, 0, 4));
}

function log_activity($group_id, $user_id, $type, $description) {
    try {
        $pdo = get_db_connection();
        $stmt = $pdo->prepare("INSERT INTO activities (group_id, user_id, activity_type, description) VALUES (?, ?, ?, ?)");
        $stmt->execute([$group_id, $user_id, $type, $description]);
    } catch (Exception $e) {
        error_log($e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        json_error('Your session has expired. Refresh the page and try again.', 419);
    }
}

$endpoint = $_GET['endpoint'] ?? '';
$endpoint = trim($endpoint, '/');
if (empty($endpoint)) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = preg_replace('#^/api/#', '', $uri);
    $endpoint = trim($uri, '/');
}

$parts = explode('/', $endpoint);
$resource = $parts[0] ?? '';

switch ($resource) {
    case 'auth':
        require_once __DIR__ . '/auth.php';
        handle_auth_routes($method, $parts);
        break;

    case 'password_reset':
        require_once __DIR__ . '/password_reset.php';
        handle_password_reset_routes($method, $parts);
        break;

    case 'groups':
        require_once __DIR__ . '/groups.php';
        handle_groups_routes($method, $parts);
        break;

    case 'invites':
        require_once __DIR__ . '/invites.php';
        handle_invites_routes($method, $parts);
        break;

    case 'expenses':
        require_once __DIR__ . '/expenses.php';
        handle_expenses_routes($method, $parts);
        break;

    case 'balances':
        require_once __DIR__ . '/balances.php';
        handle_balances_routes($method, $parts);
        break;

    case 'settlements':
        require_once __DIR__ . '/settlements.php';
        handle_settlements_routes($method, $parts);
        break;

    default:
        json_error("Route not found: /api/{$endpoint}", 404);
        break;
}
