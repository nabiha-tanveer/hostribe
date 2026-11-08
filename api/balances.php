<?php

function handle_balances_routes($method, $parts) {
    $first = $parts[1] ?? '';

    if ($first === 'dashboard' && $method === 'GET') {
        balances_dashboard();
    } elseif ($first === 'all-activity' && $method === 'GET') {
        balances_all_activity();
    } elseif ($first === 'group' && isset($parts[2]) && is_numeric($parts[2])) {
        $group_id = (int)$parts[2];
        $action = $parts[3] ?? 'balances';

        if ($action === 'balances' && $method === 'GET') {
            balances_group($group_id);
        } elseif ($action === 'activity' && $method === 'GET') {
            balances_activity($group_id);
        } else {
            json_error('Endpoint not found', 404);
        }
    } else {
        json_error('Endpoint not found', 404);
    }
}

function calculate_group_balances($group_id) {
    $pdo = get_db_connection();

    $mStmt = $pdo->prepare("
        SELECT u.id AS user_id, u.username, u.avatar_url
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY u.username ASC
    ");
    $mStmt->execute([$group_id]);
    $members = $mStmt->fetchAll();

    $memberMap = [];
    foreach ($members as $m) {
        $memberMap[$m['user_id']] = [
            'user_id' => (int)$m['user_id'],
            'username' => $m['username'],
            'avatar_url' => $m['avatar_url'],
            'total_paid' => 0.0,
            'total_share' => 0.0,
            'settlements_paid' => 0.0,
            'settlements_received' => 0.0,
            'net_balance' => 0.0
        ];
    }

    $pStmt = $pdo->prepare("
        SELECT paid_by AS user_id, COALESCE(SUM(amount), 0) AS total_paid
        FROM expenses
        WHERE group_id = ?
        GROUP BY paid_by
    ");
    $pStmt->execute([$group_id]);
    foreach ($pStmt->fetchAll() as $row) {
        if (isset($memberMap[$row['user_id']])) {
            $memberMap[$row['user_id']]['total_paid'] = (float)$row['total_paid'];
        }
    }

    $sStmt = $pdo->prepare("
        SELECT es.user_id, COALESCE(SUM(es.amount), 0) AS total_share
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        WHERE e.group_id = ?
        GROUP BY es.user_id
    ");
    $sStmt->execute([$group_id]);
    foreach ($sStmt->fetchAll() as $row) {
        if (isset($memberMap[$row['user_id']])) {
            $memberMap[$row['user_id']]['total_share'] = (float)$row['total_share'];
        }
    }

    $spStmt = $pdo->prepare("
        SELECT payer_id AS user_id, COALESCE(SUM(amount), 0) AS settlements_paid
        FROM settlements
        WHERE group_id = ?
        GROUP BY payer_id
    ");
    $spStmt->execute([$group_id]);
    foreach ($spStmt->fetchAll() as $row) {
        if (isset($memberMap[$row['user_id']])) {
            $memberMap[$row['user_id']]['settlements_paid'] = (float)$row['settlements_paid'];
        }
    }

    $srStmt = $pdo->prepare("
        SELECT payee_id AS user_id, COALESCE(SUM(amount), 0) AS settlements_received
        FROM settlements
        WHERE group_id = ?
        GROUP BY payee_id
    ");
    $srStmt->execute([$group_id]);
    foreach ($srStmt->fetchAll() as $row) {
        if (isset($memberMap[$row['user_id']])) {
            $memberMap[$row['user_id']]['settlements_received'] = (float)$row['settlements_received'];
        }
    }

    foreach ($memberMap as &$m) {
        $net = ($m['total_paid'] - $m['total_share']) + ($m['settlements_paid'] - $m['settlements_received']);
        $m['net_balance'] = round($net, 2);
    }

    return array_values($memberMap);
}

function calculate_suggested_settlements($balances, $currency = '') {
    $debtors = [];
    $creditors = [];

    foreach ($balances as $b) {
        $net = (float)$b['net_balance'];
        if ($net < -0.005) {
            $debtors[] = [
                'user_id' => $b['user_id'],
                'username' => $b['username'],
                'balance' => abs($net)
            ];
        } elseif ($net > 0.005) {
            $creditors[] = [
                'user_id' => $b['user_id'],
                'username' => $b['username'],
                'balance' => $net
            ];
        }
    }

    $suggested = [];

    while (!empty($debtors) && !empty($creditors)) {
                                                                           
        usort($debtors, function($a, $b) {
            return $b['balance'] <=> $a['balance'];
        });
        usort($creditors, function($a, $b) {
            return $b['balance'] <=> $a['balance'];
        });

        $debtor = $debtors[0];
        $creditor = $creditors[0];

        $transfer = min($debtor['balance'], $creditor['balance']);
        if ($transfer > 0.005) {
            $suggested[] = [
                'payer_id' => $debtor['user_id'],
                'payer_name' => $debtor['username'],
                'payee_id' => $creditor['user_id'],
                'payee_name' => $creditor['username'],
                'amount' => round($transfer, 2),
                'currency' => $currency
            ];
            $debtors[0]['balance'] -= $transfer;
            $creditors[0]['balance'] -= $transfer;
        }

        if ($debtors[0]['balance'] < 0.005) {
            array_shift($debtors);
        }
        if ($creditors[0]['balance'] < 0.005) {
            array_shift($creditors);
        }
    }

    return $suggested;
}

function balances_dashboard() {
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

    $total_you_owe = 0.0;
    $total_owed_to_you = 0.0;
    $group_ids = [];

    foreach ($groups as &$group) {
        $gid = (int)$group['id'];
        $group_ids[] = $gid;
        $balances = calculate_group_balances($gid);

        $user_net = 0.0;
        foreach ($balances as $b) {
            if ($b['user_id'] == $user_id) {
                $user_net = (float)$b['net_balance'];
                break;
            }
        }

        $group['user_net_balance'] = $user_net;

        if ($user_net < 0) {
            $total_you_owe += abs($user_net);
        } else {
            $total_owed_to_you += $user_net;
        }
    }

    $net_balance = round($total_owed_to_you - $total_you_owe, 2);

    $activities = [];
    if (!empty($group_ids)) {
        $inQuery = implode(',', array_fill(0, count($group_ids), '?'));
        $actStmt = $pdo->prepare("
            SELECT a.*, g.group_name, u.username
            FROM activities a
            JOIN `groups` g ON a.group_id = g.id
            JOIN users u ON a.user_id = u.id
            WHERE a.group_id IN ($inQuery)
            ORDER BY a.created_at DESC
            LIMIT 15
        ");
        $actStmt->execute($group_ids);
        $activities = $actStmt->fetchAll();
    }

    json_response([
        'summary' => [
            'total_you_owe' => round($total_you_owe, 2),
            'total_owed_to_you' => round($total_owed_to_you, 2),
            'net_balance' => $net_balance
        ],
        'groups' => $groups,
        'recent_activity' => $activities
    ]);
}

function balances_group($group_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) json_error('You are not a member of this group', 403);

    $gStmt = $pdo->prepare("SELECT currency FROM `groups` WHERE id = ?");
    $gStmt->execute([$group_id]);
    $group = $gStmt->fetch();
    $currency = $group['currency'] ?? '';

    $balances = calculate_group_balances($group_id);
    $suggested = calculate_suggested_settlements($balances, $currency);

    $totStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS total_spending FROM expenses WHERE group_id = ?");
    $totStmt->execute([$group_id]);
    $total_spending = (float)$totStmt->fetch()['total_spending'];

    json_response([
        'balances' => $balances,
        'suggested_settlements' => $suggested,
        'total_spending' => $total_spending,
        'currency' => $currency
    ]);
}

function balances_activity($group_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) json_error('Forbidden', 403);

    $actStmt = $pdo->prepare("
        SELECT a.*, u.username
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE a.group_id = ?
        ORDER BY a.created_at DESC
        LIMIT 50
    ");
    $actStmt->execute([$group_id]);
    json_response(['activities' => $actStmt->fetchAll()]);
}

function balances_all_activity() {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("SELECT group_id FROM group_members WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $group_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $activities = [];
    if (!empty($group_ids)) {
        $inQuery = implode(',', array_fill(0, count($group_ids), '?'));
        $actStmt = $pdo->prepare("
            SELECT a.*, g.group_name, u.username
            FROM activities a
            JOIN `groups` g ON a.group_id = g.id
            JOIN users u ON a.user_id = u.id
            WHERE a.group_id IN ($inQuery)
            ORDER BY a.created_at DESC
            LIMIT 100
        ");
        $actStmt->execute($group_ids);
        $activities = $actStmt->fetchAll();
    }

    json_response(['activities' => $activities]);
}
