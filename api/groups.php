<?php

function csv_safe_value($value) {
    $value = (string)$value;

    if (preg_match('/^\\s*[=+@\\-]/', $value)) {
        return "'" . $value;
    }

    return $value;
}

function handle_groups_routes($method, $parts) {
    $group_id = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;
    $action = $parts[2] ?? '';

    if ($group_id) {
        if ($action === 'leave' && $method === 'POST') {
            groups_leave($group_id);
        } elseif ($action === 'invite' && $method === 'POST') {
            require_once __DIR__ . '/invites.php';
            handle_group_invite($group_id);
        } elseif ($action === 'members' && $method === 'GET') {
            groups_members($group_id);
        } elseif (($action === 'export' || $action === 'csv') && $method === 'GET') {
            groups_export_csv($group_id);
        } elseif ($action === '' && $method === 'GET') {
            groups_get($group_id);
        } elseif ($action === '' && $method === 'PUT') {
            groups_update($group_id);
        } else {
            json_error('Endpoint not found', 404);
        }
    } else {
        $sub = $parts[1] ?? '';
        if ($sub === 'create' && $method === 'POST') {
            groups_create();
        } elseif ($sub === '' && $method === 'GET') {
            groups_list();
        } else {
            json_error('Endpoint not found', 404);
        }
    }
}

function groups_create() {
    $user_id = require_auth();
    $data = get_request_data();
    $group_name = trim($data['group_name'] ?? '');
    
    $pdo = get_db_connection();
                                                                                 
    $uStmt = $pdo->prepare("SELECT default_currency FROM users WHERE id = ?");
    $uStmt->execute([$user_id]);
    $user = $uStmt->fetch();
    $currency = !empty($data['currency']) ? strtoupper(trim($data['currency'])) : ($user['default_currency'] ?? '');
    if (strlen($currency) > 10) {
        json_error('Invalid currency');
    }

    if (strlen($group_name) < 1 || strlen($group_name) > 100) {
        json_error('Group name must be between 1 and 100 characters');
    }

    $pdo->beginTransaction();
    try {
                                      
        $stmt = $pdo->prepare("INSERT INTO `groups` (group_name, created_by, currency) VALUES (?, ?, ?)");
        $stmt->execute([$group_name, $user_id, $currency]);
        $group_id = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)");
        $stmt->execute([$group_id, $user_id]);

        log_activity($group_id, $user_id, 'GROUP_CREATED', "Created group '{$group_name}'");

        $pdo->commit();

        json_response([
            'group' => [
                'id' => $group_id,
                'group_name' => $group_name,
                'currency' => $currency,
                'created_by' => $user_id,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log($e->getMessage());
        json_error('Could not create the group. Please try again.', 500);
    }
}

function groups_list() {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("
        SELECT g.*, 
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
        FROM `groups` g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
        ORDER BY gm.last_opened_at DESC, g.created_at DESC
    ");
    $stmt->execute([$user_id]);
    $groups = $stmt->fetchAll();

    json_response(['groups' => $groups]);
}

function groups_get($group_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) {
        json_error('You are not a member of this group', 403);
    }

    $updOpen = $pdo->prepare("UPDATE group_members SET last_opened_at = NOW() WHERE group_id = ? AND user_id = ?");
    $updOpen->execute([$group_id, $user_id]);

    $stmt = $pdo->prepare("SELECT * FROM `groups` WHERE id = ?");
    $stmt->execute([$group_id]);
    $group = $stmt->fetch();
    if (!$group) json_error('Group not found', 404);

    $mList = $pdo->prepare("
        SELECT u.id, u.username, u.email, u.avatar_url, gm.joined_at
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY u.username ASC
    ");
    $mList->execute([$group_id]);
    $members = $mList->fetchAll();

    json_response(['group' => $group, 'members' => $members]);
}

function groups_members($group_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $check = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $check->execute([$group_id, $user_id]);

    if (!$check->fetch()) {
        json_error('You are not a member of this group', 403);
    }

    $mList = $pdo->prepare("
        SELECT u.id, u.username, u.email, u.avatar_url, gm.joined_at
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY u.username ASC
    ");
    $mList->execute([$group_id]);
    json_response(['members' => $mList->fetchAll()]);
}

function groups_update($group_id) {
    $user_id = require_auth();
    $data = get_request_data();
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("SELECT * FROM `groups` WHERE id = ?");
    $stmt->execute([$group_id]);
    $group = $stmt->fetch();
    if (!$group) json_error('Group not found', 404);

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) json_error('You are not a member of this group', 403);

    $group_name = trim($data['group_name'] ?? $group['group_name']);
    if (strlen($group_name) < 1 || strlen($group_name) > 100) json_error('Group name must be between 1 and 100 characters');

    $uStmt = $pdo->prepare("UPDATE `groups` SET group_name = ? WHERE id = ?");
    $uStmt->execute([$group_name, $group_id]);

    $group['group_name'] = $group_name;
    json_response(['group' => $group, 'message' => 'Group updated successfully']);
}

function groups_leave($group_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) {
        json_error('You are not a member of this group', 400);
    }

    require_once __DIR__ . '/balances.php';
    $balances = calculate_group_balances($group_id);
    $user_net = 0;
    foreach ($balances as $b) {
        if ($b['user_id'] == $user_id) {
            $user_net = (float)$b['net_balance'];
            break;
        }
    }

    if (abs($user_net) > 0.01) {
        $formatted = number_format(abs($user_net), 2);
        if ($user_net < 0) {
            json_error("Cannot leave group: you owe {$formatted}. Settle up before leaving.", 400);
        } else {
            json_error("Cannot leave group: you are owed {$formatted}. Settle up before leaving.", 400);
        }
    }

    $pdo->prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?")->execute([$group_id, $user_id]);

    $uStmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
    $uStmt->execute([$user_id]);
    $u = $uStmt->fetch();
    $name = $u['username'] ?? 'Member';

    log_activity($group_id, $user_id, 'MEMBER_LEFT', "{$name} left the group");

    json_response(['success' => true, 'message' => 'You have left the group']);
}

function groups_export_csv($group_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) {
        json_error('You are not a member of this group', 403);
    }

    $gStmt = $pdo->prepare("SELECT * FROM `groups` WHERE id = ?");
    $gStmt->execute([$group_id]);
    $group = $gStmt->fetch();
    if (!$group) {
        json_error('Group not found', 404);
    }

    $mListStmt = $pdo->prepare("
        SELECT u.id, u.username, u.email
        FROM users u
        JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY u.username ASC
    ");
    $mListStmt->execute([$group_id]);
    $members = $mListStmt->fetchAll();

    $expStmt = $pdo->prepare("
        SELECT e.*, u.username AS payer_name, u.email AS payer_email
        FROM expenses e
        JOIN users u ON e.paid_by = u.id
        WHERE e.group_id = ?
        ORDER BY e.expense_date ASC, e.id ASC
    ");
    $expStmt->execute([$group_id]);
    $expenses = $expStmt->fetchAll();

    $splitsByExpense = [];
    if (!empty($expenses)) {
        $expIds = array_column($expenses, 'id');
        $placeholders = implode(',', array_fill(0, count($expIds), '?'));
        $sStmt = $pdo->prepare("
            SELECT es.expense_id, es.user_id, es.amount, u.username
            FROM expense_splits es
            JOIN users u ON es.user_id = u.id
            WHERE es.expense_id IN ($placeholders)
            ORDER BY u.username ASC
        ");
        $sStmt->execute($expIds);
        $allSplits = $sStmt->fetchAll();
        foreach ($allSplits as $s) {
            $splitsByExpense[$s['expense_id']][$s['user_id']] = [
                'username' => $s['username'],
                'amount' => (float)$s['amount']
            ];
        }
    }

    $cleanGroupName = preg_replace('/[^a-zA-Z0-9_-]+/', '_', strtolower($group['group_name']));
    $cleanGroupName = trim($cleanGroupName, '_') ?: 'group_' . $group_id;
    $filename = 'hostribe_' . $cleanGroupName . '_expenses_' . date('Y-m-d') . '.csv';

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0, no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    $out = fopen('php://output', 'w');

    fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

    $appUrl = defined('APP_URL') ? rtrim(APP_URL, '/') : '';

    $headers = [
        'Expense ID',
        'Date',
        'Description',
        'Total Amount',
        'Paid By',
        'Split Type'
    ];

    foreach ($members as $m) {
        $headers[] = 'Share: ' . $m['username'];
    }

    $headers[] = 'All Splits Summary';
    $headers[] = 'Receipt URL';
    $headers[] = 'Created At';

    fputcsv($out, array_map('csv_safe_value', $headers));

    $totalGroupSpending = 0.0;
    $memberTotalShares = [];
    foreach ($members as $m) {
        $memberTotalShares[$m['id']] = 0.0;
    }

    foreach ($expenses as $e) {
        $eid = (int)$e['id'];
        $amount = (float)$e['amount'];
        $totalGroupSpending += $amount;
        $expSplits = $splitsByExpense[$eid] ?? [];

        $splitSummaryParts = [];
        foreach ($expSplits as $uid => $sInfo) {
            $splitSummaryParts[] = $sInfo['username'] . ': ' . number_format($sInfo['amount'], 2);
        }
        $splitSummary = implode('; ', $splitSummaryParts);

        $receiptLinks = [];
        $rawRcpt = $e['receipt_url'] ?? '';
        $urls = [];
        if (!empty($rawRcpt)) {
            if (str_starts_with($rawRcpt, '[') && str_ends_with($rawRcpt, ']')) {
                $decoded = json_decode($rawRcpt, true);
                if (is_array($decoded)) $urls = $decoded;
            } else {
                $urls = [$rawRcpt];
            }
        }
        foreach ($urls as $u) {
            $name = basename(parse_url($u, PHP_URL_PATH) ?: '');
            if (preg_match('/^receipt_[a-zA-Z0-9_-]+\\.(jpg|png|webp|gif|pdf)$/i', $name)) {
                $receiptLinks[] = $appUrl . '/receipt.php?file=' . rawurlencode($name);
            }
        }
        $receiptLink = implode(' | ', $receiptLinks);

        $row = [
            $eid,
            $e['expense_date'],
            $e['description'],
            number_format($amount, 2, '.', ''),
            $e['payer_name'],
            $e['split_type']
        ];

        foreach ($members as $m) {
            $mShare = isset($expSplits[$m['id']]) ? (float)$expSplits[$m['id']]['amount'] : 0.0;
            $memberTotalShares[$m['id']] += $mShare;
            $row[] = number_format($mShare, 2, '.', '');
        }

        $row[] = $splitSummary;
        $row[] = $receiptLink;
        $row[] = $e['created_at'];

        fputcsv($out, array_map('csv_safe_value', $row));
    }

    if (!empty($expenses)) {
        $summaryRow = [
            'TOTAL',
            '',
            'Total Group Spending',
            number_format($totalGroupSpending, 2, '.', ''),
            '',
            ''
        ];
        foreach ($members as $m) {
            $summaryRow[] = number_format($memberTotalShares[$m['id']], 2, '.', '');
        }
        $summaryRow[] = '';
        $summaryRow[] = '';
        $summaryRow[] = '';
        fputcsv($out, array_map('csv_safe_value', $summaryRow));
    }

    fclose($out);
    exit;
}
