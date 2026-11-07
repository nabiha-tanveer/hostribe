<?php

function handle_invites_routes($method, $parts) {
    $action = $parts[1] ?? '';

    if ($action === 'pending' && $method === 'GET') {
        invites_pending();
    } elseif ($action === 'token-respond' && $method === 'POST') {
        invites_token_respond();
    } elseif (is_numeric($action) && isset($parts[2]) && $parts[2] === 'respond' && $method === 'POST') {
        invites_respond((int)$action);
    } else {
        json_error('Endpoint not found', 404);
    }
}

function handle_group_invite($group_id) {
    $user_id = require_auth();
    $data = get_request_data();
    $email = strtolower(trim($data['email'] ?? ''));

    if (empty($email) || strlen($email) > 191 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Please provide a valid email address');
    }

    $pdo = get_db_connection();

    $mChk = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mChk->execute([$group_id, $user_id]);
    if (!$mChk->fetch()) {
        json_error('You must be a member of this group to invite others', 403);
    }

    $gStmt = $pdo->prepare("SELECT group_name, currency FROM `groups` WHERE id = ?");
    $gStmt->execute([$group_id]);
    $group = $gStmt->fetch();
    if (!$group) json_error('Group not found', 404);

    $uStmt = $pdo->prepare("SELECT username, email FROM users WHERE id = ?");
    $uStmt->execute([$user_id]);
    $inviter = $uStmt->fetch();

    $memChk = $pdo->prepare("
        SELECT gm.id 
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ? AND u.email = ?
    ");
    $memChk->execute([$group_id, $email]);
    if ($memChk->fetch()) {
        json_error('This user is already a member of this group');
    }

    $invChk = $pdo->prepare("SELECT id, token FROM group_invitations WHERE group_id = ? AND invitee_email = ? AND status = 'pending'");
    $invChk->execute([$group_id, $email]);
    $existingInvite = $invChk->fetch();

    $token = $existingInvite ? $existingInvite['token'] : bin2hex(random_bytes(24));

    if (!$existingInvite) {
        $stmt = $pdo->prepare("INSERT INTO group_invitations (group_id, inviter_id, invitee_email, token, status) VALUES (?, ?, ?, ?, 'pending')");
        $stmt->execute([$group_id, $user_id, $email, $token]);
    }

    $accept_url = APP_URL . "/#invite_action=accept&token=" . $token;
    $ignore_url = APP_URL . "/#invite_action=ignore&token=" . $token;
    $inviter_name = htmlspecialchars($inviter['username']);
    $group_name = htmlspecialchars($group['group_name']);

    $subject = "Hostribe: {$inviter_name} invited you to join \"{$group_name}\"";
    $html = "
    <div style='background-color:#09090b; color:#fafafa; font-family:sans-serif; padding:30px; border-radius:12px; max-width:550px; margin:auto; border:1px solid #27272a;'>
        <div style='display:flex; align-items:center; margin-bottom:20px;'>
            <h2 style='color:#fafafa; margin:0;'>Hostribe</h2>
        </div>
        <p style='color:#d4d4d8; font-size:16px;'>Hello,</p>
        <p style='color:#a1a1aa; line-height:1.6;'>
            <strong>{$inviter_name}</strong> has invited you to join the expense sharing group 
            <span style='color:#fafafa; font-weight:bold;'>\"{$group_name}\"</span> on Hostribe.
        </p>
        <div style='margin:30px 0; display:flex; gap:12px;'>
            <a href='{$accept_url}' style='background-color:#10b981; color:#09090b; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; display:inline-block;'>Accept Invitation</a>
            &nbsp;&nbsp;
            <a href='{$ignore_url}' style='background-color:#27272a; color:#e4e4e7; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; display:inline-block;'>Ignore</a>
        </div>
        <p style='color:#71717a; font-size:12px; margin-top:25px;'>
            If you already have a Hostribe account, you can also log in to accept or ignore this invitation directly from your dashboard.
        </p>
    </div>
    ";
    $text = "{$inviter_name} invited you to join group '{$group_name}' on Hostribe.\nAccept: {$accept_url}\nIgnore: {$ignore_url}";

    send_app_mail($email, $subject, $html, $text);

    log_activity($group_id, $user_id, 'MEMBER_INVITED', "{$inviter_name} invited {$email} to the group");

    json_response(['success' => true, 'message' => "Invitation sent to {$email}"]);
}

function invites_pending() {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $uStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
    $uStmt->execute([$user_id]);
    $user = $uStmt->fetch();
    if (!$user) json_error('User not found', 404);

    $stmt = $pdo->prepare("
        SELECT gi.id, gi.group_id, gi.token, gi.created_at,
               g.group_name, g.currency,
               u.username AS inviter_name
        FROM group_invitations gi
        JOIN `groups` g ON gi.group_id = g.id
        JOIN users u ON gi.inviter_id = u.id
        WHERE gi.invitee_email = ? AND gi.status = 'pending'
        ORDER BY gi.created_at DESC
    ");
    $stmt->execute([$user['email']]);
    $invites = $stmt->fetchAll();

    json_response(['invitations' => $invites]);
}

function invites_respond($invite_id) {
    $user_id = require_auth();
    $data = get_request_data();
    $action = strtolower(trim($data['action'] ?? ''));

    if (!in_array($action, ['accept', 'ignore'])) {
        json_error('Action must be accept or ignore');
    }

    $pdo = get_db_connection();
    $uStmt = $pdo->prepare("SELECT username, email, default_currency FROM users WHERE id = ?");
    $uStmt->execute([$user_id]);
    $user = $uStmt->fetch();

    $stmt = $pdo->prepare("SELECT * FROM group_invitations WHERE id = ? AND invitee_email = ? AND status = 'pending'");
    $stmt->execute([$invite_id, $user['email']]);
    $invite = $stmt->fetch();

    if (!$invite) {
        json_error('Invitation not found or already responded to', 404);
    }

    $group_id = (int)$invite['group_id'];

    if ($action === 'accept') {
        $pdo->beginTransaction();
        try {
                                  
            $mStmt = $pdo->prepare("INSERT IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)");
            $mStmt->execute([$group_id, $user_id]);

            $upStmt = $pdo->prepare("UPDATE group_invitations SET status = 'accepted', responded_at = NOW() WHERE id = ?");
            $upStmt->execute([$invite_id]);

            log_activity($group_id, $user_id, 'MEMBER_JOINED', "{$user['username']} joined the group");

            $pdo->commit();
            json_response(['success' => true, 'action' => 'accepted', 'group_id' => $group_id, 'message' => 'Invitation accepted! Welcome to the group.']);
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log($e->getMessage());
            json_error('Could not accept the invitation. Please try again.', 500);
        }
    } else {
        $upStmt = $pdo->prepare("UPDATE group_invitations SET status = 'ignored', responded_at = NOW() WHERE id = ?");
        $upStmt->execute([$invite_id]);
        json_response(['success' => true, 'action' => 'ignored', 'message' => 'Invitation dismissed']);
    }
}

function invites_token_respond() {
    $user_id = require_auth();
    $data = get_request_data();
    $token = trim($data['token'] ?? '');
    $action = strtolower(trim($data['action'] ?? ''));

    if (empty($token) || !in_array($action, ['accept', 'ignore'])) {
        json_error('Token and valid action (accept/ignore) are required');
    }

    $pdo = get_db_connection();
    $stmt = $pdo->prepare("SELECT * FROM group_invitations WHERE token = ? AND status = 'pending' LIMIT 1");
    $stmt->execute([$token]);
    $invite = $stmt->fetch();

    if (!$invite) {
        json_error('Invalid or already processed invitation token', 400);
    }

    $uStmt = $pdo->prepare("SELECT username, email, default_currency FROM users WHERE id = ?");
    $uStmt->execute([$user_id]);
    $user = $uStmt->fetch();

    if (!$user || strtolower($invite['invitee_email']) !== strtolower($user['email'])) {
        json_error('This invitation belongs to another email address', 403);
    }

    $group_id = (int)$invite['group_id'];

    if ($action === 'accept') {
        $pdo->beginTransaction();
        try {
            $mStmt = $pdo->prepare("INSERT IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)");
            $mStmt->execute([$group_id, $user_id]);

            $upStmt = $pdo->prepare("UPDATE group_invitations SET status = 'accepted', responded_at = NOW() WHERE id = ?");
            $upStmt->execute([$invite['id']]);

            log_activity($group_id, $user_id, 'MEMBER_JOINED', "{$user['username']} joined the group");

            $pdo->commit();
            json_response(['success' => true, 'action' => 'accepted', 'group_id' => $group_id, 'message' => 'Invitation accepted! Welcome to the group.']);
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log($e->getMessage());
            json_error('Could not accept the invitation. Please try again.', 500);
        }
    } else {
        $upStmt = $pdo->prepare("UPDATE group_invitations SET status = 'ignored', responded_at = NOW() WHERE id = ?");
        $upStmt->execute([$invite['id']]);
        json_response(['success' => true, 'action' => 'ignored', 'message' => 'Invitation ignored']);
    }
}
