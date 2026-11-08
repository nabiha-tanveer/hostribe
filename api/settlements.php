<?php

function handle_settlements_routes($method, $parts) {
    if ($method === 'POST') {
        settlements_create();
    } else {
        json_error('Method not allowed', 405);
    }
}

function settlements_create() {
    $user_id = require_auth();
    $data = get_request_data();
    $pdo = get_db_connection();

    $group_id = (int)($data['group_id'] ?? 0);
    $payer_id = (int)($data['payer_id'] ?? 0);
    $payee_id = (int)($data['payee_id'] ?? 0);
    $amountInput = $data['amount'] ?? '';
    $amount = is_numeric($amountInput) ? (float)$amountInput : 0;
    $notes = trim($data['notes'] ?? '');

    if ($group_id <= 0 || $payer_id <= 0 || $payee_id <= 0 || !is_valid_amount($amountInput) || $amount > 9999999999.99 || strlen($notes) > 255) {
        json_error('Group, payer, payee, and an amount greater than 0 are required');
    }

    if ($payer_id === $payee_id) {
        json_error('Payer and payee cannot be the same member');
    }

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) {
        json_error('You are not a member of this group', 403);
    }

    $chkStmt = $pdo->prepare("SELECT user_id FROM group_members WHERE group_id = ? AND user_id IN (?, ?)");
    $chkStmt->execute([$group_id, $payer_id, $payee_id]);
    $found_members = $chkStmt->fetchAll(PDO::FETCH_COLUMN);
    if (count($found_members) < 2) {
        json_error('Both payer and payee must be valid members of this group');
    }

    $gStmt = $pdo->prepare("SELECT currency FROM `groups` WHERE id = ?");
    $gStmt->execute([$group_id]);
    $group = $gStmt->fetch();
    $currency = $group['currency'] ?? '';

    $uStmt = $pdo->prepare("SELECT id, username FROM users WHERE id IN (?, ?)");
    $uStmt->execute([$payer_id, $payee_id]);
    $users = $uStmt->fetchAll(PDO::FETCH_KEY_PAIR);
    $payer_name = $users[$payer_id] ?? 'Payer';
    $payee_name = $users[$payee_id] ?? 'Payee';

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            INSERT INTO settlements (group_id, payer_id, payee_id, amount, currency, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$group_id, $payer_id, $payee_id, $amount, $currency, $notes ?: null]);
        $settlement_id = (int)$pdo->lastInsertId();

        $logMsg = "{$payer_name} paid {$payee_name} " . number_format($amount, 2) . " (Settled debt)";
        if (!empty($notes)) {
            $logMsg .= " (Notes: {$notes})";
        }
        log_activity($group_id, $user_id, 'SETTLEMENT', $logMsg);

        $pdo->commit();
        json_response([
            'success' => true,
            'settlement_id' => $settlement_id,
            'message' => 'Payment settlement recorded successfully'
        ], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log($e->getMessage());
        json_error('Could not record the settlement. Please try again.', 500);
    }
}
