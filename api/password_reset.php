<?php

function handle_password_reset_routes($method, $parts) {
    $action = $parts[1] ?? '';

    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    if ($action === 'request') {
        password_reset_request();
    }

    if ($action === 'confirm') {
        password_reset_confirm();
    }

    if ($action === 'reset' || $action === 'change' || $action === 'direct' || $action === '') {
        password_reset_direct();
    }

    json_error('Endpoint not found', 404);
}

function password_reset_direct() {
    $data = get_request_data();
    $email = strtolower(trim($data['email'] ?? $data['identifier'] ?? ''));
    $password = $data['password'] ?? $data['new_password'] ?? '';

    if (empty($email)) {
        json_error('Please enter your account email address', 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
        json_error('Please enter a valid email address', 400);
    }

    if (strlen($password) < 6 || strlen($password) > 255) {
        json_error('Password must be at least 6 characters long', 400);
    }

    $pdo = get_db_connection();
    $stmt = $pdo->prepare('SELECT id, username, email FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('No account was found with that email address', 404);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $up = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $up->execute([$hash, $user['id']]);

    try {
        $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$user['id']]);
    } catch (Exception $e) {
        error_log($e->getMessage());
    }

    json_response([
        'success' => true,
        'message' => 'Password reset successfully! You can now log in with your new password.'
    ]);
}

function password_reset_request() {
    $data = get_request_data();
    $email = strtolower(trim($data['email'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
        json_error('Please enter a valid email address');
    }

    $now = time();

    if (!isset($_SESSION['reset_requests']) || $now - $_SESSION['reset_request_time'] > 900) {
        $_SESSION['reset_requests'] = 0;
        $_SESSION['reset_request_time'] = $now;
    }

    $_SESSION['reset_requests']++;

    if ($_SESSION['reset_requests'] > 5) {
        json_error('Too many requests. Try again later.', 429);
    }

    $pdo = get_db_connection();
    $stmt = $pdo->prepare('SELECT id, username, email FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $check = $pdo->prepare('SELECT id FROM password_resets WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)');
        $check->execute([$user['id']]);

        if (!$check->fetch()) {
            $token = bin2hex(random_bytes(32));
            $token_hash = hash('sha256', $token);

            $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$user['id']]);

            $insert = $pdo->prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))');
            $insert->execute([$user['id'], $token_hash]);

            $reset_url = APP_URL . '/#reset-password?token=' . rawurlencode($token);
            $safe_name = htmlspecialchars($user['username'], ENT_QUOTES, 'UTF-8');
            $safe_url = htmlspecialchars($reset_url, ENT_QUOTES, 'UTF-8');

            $html = '<p>Hello ' . $safe_name . ',</p>';
            $html .= '<p>Use the link below to reset your Hostribe password. The link expires in one hour.</p>';
            $html .= '<p><a href="' . $safe_url . '">Reset Password</a></p>';
            $html .= '<p>If you did not request this change, you can ignore this email.</p>';

            $text = "Hello {$user['username']},\n\nReset your Hostribe password using this link: {$reset_url}\n\nThe link expires in one hour.";

            send_app_mail($user['email'], 'Hostribe Password Reset', $html, $text);
        }
    }

    json_response([
        'success' => true,
        'message' => 'If the email is registered, a password reset link will be sent shortly.'
    ]);
}

function password_reset_confirm() {
    $data = get_request_data();
    $token = trim($data['token'] ?? '');
    $password = $data['password'] ?? '';

    if (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
        json_error('This password reset link is invalid or has expired.', 400);
    }

    if (strlen($password) < 6 || strlen($password) > 255) {
        json_error('Password must be at least 6 characters long');
    }

    $pdo = get_db_connection();
    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare('SELECT id, user_id FROM password_resets WHERE token_hash = ? AND expires_at > NOW() LIMIT 1 FOR UPDATE');
        $stmt->execute([hash('sha256', $token)]);
        $reset = $stmt->fetch();

        if (!$reset) {
            $pdo->rollBack();
            json_error('This password reset link is invalid or has expired.', 400);
        }

        $update = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $update->execute([password_hash($password, PASSWORD_DEFAULT), $reset['user_id']]);

        $delete = $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?');
        $delete->execute([$reset['user_id']]);

        $pdo->commit();

        json_response([
            'success' => true,
            'message' => 'Password updated. You can now log in.'
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log($e->getMessage());
        json_error('Could not update the password. Please try again.', 500);
    }
}
