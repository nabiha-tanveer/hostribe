<?php

function handle_auth_routes($method, $parts) {
    $action = $parts[1] ?? '';

    switch ($action) {
        case 'csrf':
            if ($method !== 'GET') json_error('Method not allowed', 405);
            json_response(['csrf_token' => $_SESSION['csrf_token']]);
            break;

        case 'signup':
            if ($method !== 'POST') json_error('Method not allowed', 405);
            auth_signup();
            break;

        case 'login':
            if ($method !== 'POST') json_error('Method not allowed', 405);
            auth_login();
            break;

        case 'me':
            if ($method !== 'GET') json_error('Method not allowed', 405);
            auth_me();
            break;

        case 'update-profile':
            if ($method !== 'POST' && $method !== 'PUT') json_error('Method not allowed', 405);
            auth_update_profile();
            break;

        case 'logout':
            if ($method !== 'POST') json_error('Method not allowed', 405);
            auth_logout();
            break;

        default:
            json_error('Unknown auth endpoint', 404);
            break;
    }
}

function auth_signup() {
    $data = get_request_data();
    $username = trim($data['username'] ?? $data['name'] ?? '');
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $default_currency = strtoupper(trim($data['default_currency'] ?? ''));
    if (strlen($default_currency) > 10) {
        json_error('Invalid currency');
    }

    if (strlen($username) < 2 || strlen($username) > 100) {
        json_error('Please enter your name (2-80 characters)');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
        json_error('Please enter a valid email address');
    }
    if (strlen($password) < 6 || strlen($password) > 255) {
        json_error('Password must be at least 6 characters long');
    }

    $pdo = get_db_connection();

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        json_error('An account with this email already exists', 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $ins = $pdo->prepare("INSERT INTO users (username, email, password_hash, default_currency) VALUES (?, ?, ?, ?)");
    $ins->execute([$username, $email, $hash, $default_currency]);
    $user_id = (int)$pdo->lastInsertId();

    session_regenerate_id(true);
    $_SESSION['user_id'] = $user_id;

    json_response([
        'success' => true,
        'message' => 'Account created successfully! Welcome to Hostribe.',
        'user' => [
            'id' => $user_id,
            'username' => $username,
            'email' => $email,
            'default_currency' => $default_currency,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ], 201);
}

function auth_login() {
    $data = get_request_data();
    $identifier = trim($data['identifier'] ?? $data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($identifier) || empty($password)) {
        json_error('Please provide your username/email and password');
    }

    if (!empty($_SESSION['login_blocked_until']) && $_SESSION['login_blocked_until'] > time()) {
        json_error('Too many login attempts. Try again later.', 429);
    }

    $pdo = get_db_connection();
                                                     
    $stmt = $pdo->prepare("SELECT id, username, email, password_hash, default_currency, avatar_url, created_at FROM users WHERE email = ? OR username = ? LIMIT 1");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;

        if ($_SESSION['login_attempts'] >= 5) {
            $_SESSION['login_blocked_until'] = time() + 900;
            $_SESSION['login_attempts'] = 0;
        }

        json_error('Invalid email/username or password', 401);
    }

    session_regenerate_id(true);
    unset($_SESSION['login_attempts'], $_SESSION['login_blocked_until']);
    $_SESSION['user_id'] = (int)$user['id'];

    unset($user['password_hash']);
    json_response(['user' => $user]);
}

function auth_me() {
    $user_id = require_auth();
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("SELECT id, username, email, default_currency, avatar_url, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    if (!$user) {
        session_destroy();
        json_error('User not found', 404);
    }
    json_response(['user' => $user]);
}

function auth_update_profile() {
    $user_id = require_auth();
    $data = get_request_data();
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("SELECT id, username, email, password_hash, default_currency, avatar_url, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $current_user = $stmt->fetch();
    if (!$current_user) json_error('User not found', 404);

    if (isset($data['username']) && $data['username'] !== $current_user['username']) {
        json_error('Changing username is strictly prohibited', 400);
    }

    $email = isset($data['email']) ? strtolower(trim($data['email'])) : $current_user['email'];
    $new_password = $data['password'] ?? '';
    $current_password = $data['current_password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
        json_error('Please enter a valid email address');
    }

    if ($email !== $current_user['email']) {
        $chk = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $chk->execute([$email, $user_id]);
        if ($chk->fetch()) {
            json_error('Email address is already in use by another account');
        }
    }

    $updates = ["email = ?"];
    $params = [$email];

    if (!empty($new_password)) {
        if (strlen($new_password) < 6 || strlen($new_password) > 255) {
            json_error('New password must be at least 6 characters long');
        }

        if (empty($current_password) || !password_verify($current_password, $current_user['password_hash'])) {
            json_error('Enter your current password to change it', 401);
        }

        $updates[] = "password_hash = ?";
        $params[] = password_hash($new_password, PASSWORD_DEFAULT);
    }

    $params[] = $user_id;
    $pdo->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);

    $stmt = $pdo->prepare("SELECT id, username, email, default_currency, avatar_url, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $updated = $stmt->fetch();

    json_response(['user' => $updated, 'message' => 'Profile updated successfully']);
}

function auth_logout() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    json_response(['success' => true, 'message' => 'Logged out successfully']);
}
