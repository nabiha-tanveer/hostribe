<?php

function handle_expenses_routes($method, $parts) {
    $first = $parts[1] ?? '';
    
    if ($first === 'group' && isset($parts[2]) && is_numeric($parts[2])) {
        if ($method === 'GET') {
            expenses_list_by_group((int)$parts[2]);
        } else {
            json_error('Method not allowed', 405);
        }
    } elseif ($first === 'upload' && $method === 'POST') {
        expenses_upload_receipt();
    } elseif (($first === 'delete-receipt' || $first === 'delete_receipt') && ($method === 'POST' || $method === 'DELETE')) {
        expenses_delete_receipt();
    } elseif (is_numeric($first)) {
        $expense_id = (int)$first;
        if ($method === 'GET') {
            expenses_get($expense_id);
        } elseif ($method === 'PUT') {
            expenses_update($expense_id);
        } elseif ($method === 'DELETE') {
            expenses_delete($expense_id);
        } else {
            json_error('Method not allowed', 405);
        }
    } elseif ($first === '' && $method === 'POST') {
        expenses_create();
    } else {
        json_error('Endpoint not found', 404);
    }
}

function expenses_list_by_group($group_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) {
        json_error('You are not a member of this group', 403);
    }

    $stmt = $pdo->prepare("
        SELECT e.*, u.username AS payer_name
        FROM expenses e
        JOIN users u ON e.paid_by = u.id
        WHERE e.group_id = ?
        ORDER BY e.expense_date DESC, e.id DESC
    ");
    $stmt->execute([$group_id]);
    $expenses = $stmt->fetchAll();

    if (!empty($expenses)) {
        $expense_ids = array_column($expenses, 'id');
        $inQuery = implode(',', array_fill(0, count($expense_ids), '?'));
        
        $sStmt = $pdo->prepare("
            SELECT es.expense_id, es.user_id, es.amount, u.username
            FROM expense_splits es
            JOIN users u ON es.user_id = u.id
            WHERE es.expense_id IN ($inQuery)
            ORDER BY u.username ASC
        ");
        $sStmt->execute($expense_ids);
        $allSplits = $sStmt->fetchAll();

        $splitsByExpense = [];
        foreach ($allSplits as $s) {
            $splitsByExpense[$s['expense_id']][] = [
                'user_id' => (int)$s['user_id'],
                'username' => $s['username'],
                'amount' => (float)$s['amount']
            ];
        }

        foreach ($expenses as &$exp) {
            $exp['id'] = (int)$exp['id'];
            $exp['group_id'] = (int)$exp['group_id'];
            $exp['paid_by'] = (int)$exp['paid_by'];
            $exp['amount'] = (float)$exp['amount'];
            $exp['splits'] = $splitsByExpense[$exp['id']] ?? [];
            $exp['receipt_urls'] = display_receipt_urls(parse_receipt_urls($exp['receipt_url'] ?? null));
            $exp['receipt_url'] = $exp['receipt_urls'][0] ?? null;
        }
    }

    json_response(['expenses' => $expenses]);
}

function expenses_get($expense_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("
        SELECT e.*, u.username AS payer_name
        FROM expenses e
        JOIN users u ON e.paid_by = u.id
        WHERE e.id = ?
    ");
    $stmt->execute([$expense_id]);
    $expense = $stmt->fetch();
    if (!$expense) json_error('Expense not found', 404);

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$expense['group_id'], $user_id]);
    if (!$mStmt->fetch()) json_error('Forbidden', 403);

    $sStmt = $pdo->prepare("
        SELECT es.user_id, es.amount, u.username
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        WHERE es.expense_id = ?
    ");
    $sStmt->execute([$expense_id]);
    $expense['splits'] = $sStmt->fetchAll();
    $expense['receipt_urls'] = display_receipt_urls(parse_receipt_urls($expense['receipt_url'] ?? null));
    $expense['receipt_url'] = $expense['receipt_urls'][0] ?? null;

    json_response(['expense' => $expense]);
}

function expenses_create() {
    $user_id = require_auth();
    $data = get_request_data();
    $pdo = get_db_connection();

    $group_id = (int)($data['group_id'] ?? 0);
    $description = trim($data['description'] ?? '');
    $amountInput = $data['amount'] ?? '';
    $amount = is_numeric($amountInput) ? (float)$amountInput : 0;
    $paid_by = (int)($data['paid_by'] ?? $user_id);
    $expense_date = trim($data['expense_date'] ?? date('Y-m-d'));
    $split_type = strtoupper(trim($data['split_type'] ?? 'EQUAL'));
    if (!in_array($split_type, ['EQUAL', 'EXACT'], true)) {
        json_error('Invalid split type');
    }
    $raw_splits = $data['splits'] ?? [];

    if ($group_id <= 0 || $description === '' || strlen($description) > 255 || !is_valid_amount($amountInput) || $amount > 9999999999.99 || !is_valid_date($expense_date)) {
        json_error('Group ID, description, and an amount greater than 0 are required');
    }

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) json_error('You are not a member of this group', 403);

    $mCheckPayer = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mCheckPayer->execute([$group_id, $paid_by]);
    if (!$mCheckPayer->fetch()) json_error('Payer must be a member of this group', 400);

    $gStmt = $pdo->prepare("SELECT currency, group_name FROM `groups` WHERE id = ?");
    $gStmt->execute([$group_id]);
    $group = $gStmt->fetch();
    if (!$group) json_error('Group not found', 404);
    $currency = $group['currency'];

    $splits = process_and_validate_splits($split_type, $amount, $raw_splits, $group_id);

    $rawReceipts = $data['receipt_urls'] ?? $data['receipt_url'] ?? null;
    $receiptUrls = parse_receipt_urls($rawReceipts);
    $files = extract_uploaded_files();
    foreach ($files as $f) {
        try {
            $receiptUrls[] = save_uploaded_receipt_file($f);
        } catch (Exception $e) {
            json_error($e->getMessage(), 400);
        }
    }
    $receipt_url = encode_receipt_urls($receiptUrls);

    $pdo->beginTransaction();
    try {
                                   
        $stmt = $pdo->prepare("
            INSERT INTO expenses (group_id, paid_by, description, amount, currency, expense_date, split_type, receipt_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$group_id, $paid_by, $description, $amount, $currency, $expense_date, $split_type, $receipt_url]);
        $expense_id = (int)$pdo->lastInsertId();

        $splitStmt = $pdo->prepare("INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)");
        foreach ($splits as $sp) {
            $splitStmt->execute([$expense_id, $sp['user_id'], $sp['amount']]);
        }

        $pStmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
        $pStmt->execute([$paid_by]);
        $payer = $pStmt->fetch();
        $payer_name = $payer['username'] ?? 'Member';

        $formattedAmount = number_format($amount, 2);
        log_activity($group_id, $user_id, 'EXPENSE_ADDED', "{$payer_name} added expense '{$description}' ({$formattedAmount})");

        $pdo->commit();

        foreach ($receiptUrls as $receiptUrl) {
            $name = basename(parse_url($receiptUrl, PHP_URL_PATH));
            unset($_SESSION['receipt_uploads'][$name]);
        }

        json_response([
            'success' => true,
            'expense_id' => $expense_id,
            'message' => 'Expense added successfully'
        ], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log($e->getMessage());
        json_error('Could not save the expense. Please try again.', 500);
    }
}

function expenses_update($expense_id) {
    $user_id = require_auth();
    $data = get_request_data();
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
    $stmt->execute([$expense_id]);
    $expense = $stmt->fetch();
    if (!$expense) json_error('Expense not found', 404);

    $group_id = (int)$expense['group_id'];

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) json_error('Forbidden', 403);

    $description = trim($data['description'] ?? $expense['description']);
    $amount = isset($data['amount']) ? (float)$data['amount'] : (float)$expense['amount'];
    $paid_by = isset($data['paid_by']) ? (int)$data['paid_by'] : (int)$expense['paid_by'];
    $expense_date = trim($data['expense_date'] ?? $expense['expense_date']);
    $split_type = strtoupper(trim($data['split_type'] ?? $expense['split_type']));
    if (!in_array($split_type, ['EQUAL', 'EXACT'], true)) {
        json_error('Invalid split type');
    }
    $raw_splits = $data['splits'] ?? [];

    if ($description === '' || strlen($description) > 255 || !is_valid_amount($data['amount'] ?? $expense['amount']) || $amount > 9999999999.99 || !is_valid_date($expense_date)) {
        json_error('Enter a valid description, amount, and date');
    }

    $mCheckPayer = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mCheckPayer->execute([$group_id, $paid_by]);
    if (!$mCheckPayer->fetch()) json_error('Payer must be a member of this group', 400);

    $splits = process_and_validate_splits($split_type, $amount, $raw_splits, $group_id);

    $oldReceipts = parse_receipt_urls($expense['receipt_url'] ?? null);
    $hasNewReceiptData = array_key_exists('receipt_urls', $data) || array_key_exists('receipt_url', $data);
    $receiptUrls = $hasNewReceiptData 
        ? parse_receipt_urls($data['receipt_urls'] ?? $data['receipt_url'] ?? null) 
        : $oldReceipts;

    $files = extract_uploaded_files();
    foreach ($files as $f) {
        try {
            $receiptUrls[] = save_uploaded_receipt_file($f);
        } catch (Exception $e) {
            json_error($e->getMessage(), 400);
        }
    }
    $receipt_url = encode_receipt_urls($receiptUrls);

    $pdo->beginTransaction();
    try {
        $uStmt = $pdo->prepare("
            UPDATE expenses 
            SET description = ?, amount = ?, paid_by = ?, expense_date = ?, split_type = ?, receipt_url = ?
            WHERE id = ?
        ");
        $uStmt->execute([$description, $amount, $paid_by, $expense_date, $split_type, $receipt_url, $expense_id]);

        $pdo->prepare("DELETE FROM expense_splits WHERE expense_id = ?")->execute([$expense_id]);

        $splitStmt = $pdo->prepare("INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)");
        foreach ($splits as $sp) {
            $splitStmt->execute([$expense_id, $sp['user_id'], $sp['amount']]);
        }

        log_activity($group_id, $user_id, 'EXPENSE_UPDATED', "Updated expense '{$description}'");

        $pdo->commit();

        foreach ($receiptUrls as $receiptUrl) {
            $name = basename(parse_url($receiptUrl, PHP_URL_PATH));
            unset($_SESSION['receipt_uploads'][$name]);
        }

        $removed = array_diff($oldReceipts, $receiptUrls);
        foreach ($removed as $rem) {
            delete_receipt_file_if_local($rem);
        }

        json_response(['success' => true, 'message' => 'Expense updated successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log($e->getMessage());
        json_error('Could not update the expense. Please try again.', 500);
    }
}

function expenses_delete($expense_id) {
    $user_id = require_auth();
    $pdo = get_db_connection();

    $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
    $stmt->execute([$expense_id]);
    $expense = $stmt->fetch();
    if (!$expense) json_error('Expense not found', 404);

    $group_id = (int)$expense['group_id'];

    $mStmt = $pdo->prepare("SELECT id FROM group_members WHERE group_id = ? AND user_id = ?");
    $mStmt->execute([$group_id, $user_id]);
    if (!$mStmt->fetch()) json_error('Forbidden', 403);

    $pdo->beginTransaction();
    try {
        $desc = $expense['description'];
        $pdo->prepare("DELETE FROM expenses WHERE id = ?")->execute([$expense_id]);
        log_activity($group_id, $user_id, 'EXPENSE_DELETED', "Deleted expense '{$desc}'");

        $pdo->commit();

        $rcpts = parse_receipt_urls($expense['receipt_url'] ?? null);
        foreach ($rcpts as $r) {
            delete_receipt_file_if_local($r);
        }

        json_response(['success' => true, 'message' => 'Expense deleted successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log($e->getMessage());
        json_error('Could not delete the expense. Please try again.', 500);
    }
}

function process_and_validate_splits($split_type, $total_amount, $raw_splits, $group_id) {
    if (empty($raw_splits) || !is_array($raw_splits)) {
        json_error('At least one member must be selected for expense split');
    }

    $pdo = get_db_connection();
                                                                  
    $mStmt = $pdo->prepare("SELECT user_id FROM group_members WHERE group_id = ?");
    $mStmt->execute([$group_id]);
    $valid_members = array_column($mStmt->fetchAll(), 'user_id');

    $final_splits = [];

    if ($split_type === 'EQUAL') {
        $member_ids = [];
        foreach ($raw_splits as $r) {
            $uid = is_array($r) ? (int)($r['user_id'] ?? 0) : (int)$r;
            if ($uid > 0 && in_array($uid, $valid_members)) {
                $member_ids[] = $uid;
            }
        }
        $member_ids = array_unique($member_ids);
        $count = count($member_ids);
        if ($count === 0) {
            json_error('Please select at least one valid group member for split');
        }

        $base_share = floor(($total_amount / $count) * 100) / 100;
        $allocated = $base_share * $count;
        $remainder = round($total_amount - $allocated, 2);

        $i = 0;
        foreach ($member_ids as $uid) {
            $share = $base_share;
            if ($i === 0) {
                $share = round($share + $remainder, 2);
            }
            $final_splits[] = [
                'user_id' => $uid,
                'amount' => $share
            ];
            $i++;
        }
    } else {
                                                                           
        $sum = 0.0;
        foreach ($raw_splits as $r) {
            if (!is_array($r)) continue;
            $uid = (int)($r['user_id'] ?? 0);
            $amt = (float)($r['amount'] ?? 0);
            if ($uid > 0 && in_array($uid, $valid_members) && $amt > 0) {
                $final_splits[] = [
                    'user_id' => $uid,
                    'amount' => round($amt, 2)
                ];
                $sum += round($amt, 2);
            }
        }

        if (empty($final_splits)) {
            json_error('At least one member must have an exact amount assigned');
        }

        if (abs($sum - $total_amount) > 0.01) {
            json_error('Total of exact splits (' . number_format($sum, 2) . ') must equal total expense amount (' . number_format($total_amount, 2) . ')');
        }
    }

    return $final_splits;
}

function parse_receipt_urls($raw) {
    if (empty($raw)) {
        return [];
    }

    if (!is_array($raw)) {
        $raw = trim((string)$raw);
        $decoded = json_decode($raw, true);
        $raw = is_array($decoded) ? $decoded : [$raw];
    }

    $urls = [];

    foreach ($raw as $url) {
        if (!is_string($url) || trim($url) === '') {
            continue;
        }

        $parts = parse_url(trim($url));

        if (($parts['path'] ?? '') === '/receipt.php') {
            parse_str($parts['query'] ?? '', $query);
            $name = basename($query['file'] ?? '');

            if (preg_match('/^[a-zA-Z0-9_-]+\\.(jpg|png|webp|gif|pdf)$/i', $name)) {
                $url = '/uploads/receipts/' . $name;
            }
        }

        $urls[] = $url;
    }

    return array_values(array_unique($urls));
}

function display_receipt_url($url) {
    $parts = parse_url($url);
    $path = $parts['path'] ?? '';

    if (str_starts_with($path, '/uploads/receipts/')) {
        $name = basename($path);

        if (preg_match('/^[a-zA-Z0-9_-]+\\.(jpg|png|webp|gif|pdf)$/i', $name)) {
            return '/receipt.php?file=' . rawurlencode($name);
        }
    }

    return $url;
}

function display_receipt_urls($urls) {
    $result = [];

    foreach ($urls as $url) {
        $result[] = display_receipt_url($url);
    }

    return $result;
}

function encode_receipt_urls($input) {
    $urls = parse_receipt_urls($input);
    if (empty($urls)) return null;
    return json_encode(array_values(array_unique($urls)), JSON_UNESCAPED_SLASHES);
}

function extract_uploaded_files() {
    $files = [];
    foreach ($_FILES as $key => $fileInfo) {
        if (!is_array($fileInfo) || !isset($fileInfo['name'])) continue;
        if (is_array($fileInfo['name'])) {
            for ($i = 0; $i < count($fileInfo['name']); $i++) {
                if (!empty($fileInfo['name'][$i])) {
                    $files[] = [
                        'name' => $fileInfo['name'][$i],
                        'type' => $fileInfo['type'][$i] ?? '',
                        'tmp_name' => $fileInfo['tmp_name'][$i],
                        'error' => $fileInfo['error'][$i],
                        'size' => $fileInfo['size'][$i]
                    ];
                }
            }
        } else {
            if (!empty($fileInfo['name'])) {
                $files[] = $fileInfo;
            }
        }
    }
    return $files;
}

function expenses_upload_receipt() {
    $user_id = require_auth();

    $files = extract_uploaded_files();
    if (empty($files)) {
        json_error('No files uploaded. Please select one or more images or PDF receipts.', 400);
    }

    $uploadedUrls = [];
    $errors = [];
    foreach ($files as $file) {
        try {
            $uploadedUrls[] = save_uploaded_receipt_file($file);
        } catch (Exception $e) {
            $errors[] = ($file['name'] ?? 'File') . ': ' . $e->getMessage();
        }
    }

    if (empty($uploadedUrls)) {
        json_error('Failed to upload receipts: ' . implode('; ', $errors), 400);
    }

    if (mt_rand(1, 5) === 1) {
        expenses_cleanup_orphaned_uploads();
    }

    json_response([
        'success' => true,
        'receipt_urls' => display_receipt_urls($uploadedUrls),
        'receipt_url' => display_receipt_url($uploadedUrls[0]),
        'errors' => $errors,
        'message' => count($uploadedUrls) . ' receipt(s) uploaded successfully'
    ], 200);
}

function save_uploaded_receipt_file($file) {
    if (!isset($file['error']) || is_array($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('The file could not be uploaded.');
    }

    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        throw new Exception('Invalid uploaded file.');
    }

    if (empty($file['size']) || $file['size'] > 10 * 1024 * 1024) {
        throw new Exception('File size must be less than 10MB.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);

    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'application/pdf' => 'pdf'
    ];

    if (!isset($allowedMimes[$mime])) {
        throw new Exception('Only JPG, PNG, WEBP, GIF and PDF files are allowed.');
    }

    if (str_starts_with($mime, 'image/') && !getimagesize($file['tmp_name'])) {
        throw new Exception('The image file is not valid.');
    }

    $uploadDir = __DIR__ . '/../storage/receipts';

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0750, true) && !is_dir($uploadDir)) {
        throw new Exception('Could not prepare receipt storage.');
    }

    $fileName = 'receipt_' . date('Ymd_His') . '_' . bin2hex(random_bytes(12)) . '.' . $allowedMimes[$mime];
    $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Could not save the receipt.');
    }

    chmod($targetPath, 0644);

    if (!isset($_SESSION['receipt_uploads'])) {
        $_SESSION['receipt_uploads'] = [];
    }

    $_SESSION['receipt_uploads'][$fileName] = time();

    return '/uploads/receipts/' . $fileName;
}

function delete_receipt_file_if_local($receipt_url) {
    if (!is_string($receipt_url) || $receipt_url === '') {
        return;
    }

    $parts = parse_url($receipt_url);
    $path = $parts['path'] ?? '';
    $name = '';

    if ($path === '/receipt.php') {
        parse_str($parts['query'] ?? '', $query);
        $name = basename($query['file'] ?? '');
    } elseif (str_starts_with($path, '/uploads/receipts/')) {
        $name = basename($path);
    }

    if (!preg_match('/^receipt_[a-zA-Z0-9_-]+\\.(jpg|png|webp|gif|pdf)$/i', $name)) {
        return;
    }

    $pdo = get_db_connection();
    $stmt = $pdo->prepare('SELECT id FROM expenses WHERE LOCATE(?, receipt_url) > 0 LIMIT 1');
    $stmt->execute([$name]);

    if ($stmt->fetch()) {
        return;
    }

    $filePath = __DIR__ . '/../storage/receipts/' . $name;

    if (is_file($filePath)) {
        unlink($filePath);
        unset($_SESSION['receipt_uploads'][$name]);
    }
}

function expenses_delete_receipt() {
    $user_id = require_auth();
    $data = get_request_data();
    $raw = $data['receipt_url'] ?? $data['receipt_urls'] ?? null;
    if (!$raw && isset($_GET['receipt_url'])) {
        $raw = $_GET['receipt_url'];
    }

    $urls = [];
    if (is_array($raw)) {
        $urls = $raw;
    } elseif (is_string($raw)) {
        $urls = [$raw];
    }

    if (empty($urls)) {
        json_error('Receipt URL is required', 400);
    }

    $pdo = get_db_connection();

    $deleted = [];
    foreach ($urls as $item) {
        if (!is_string($item) || trim($item) === '') {
            continue;
        }

        $normalized = parse_receipt_urls([$item]);
        $basename = isset($normalized[0]) ? basename(parse_url($normalized[0], PHP_URL_PATH)) : '';

        if (!preg_match('/^receipt_[a-zA-Z0-9_-]+\\.(jpg|png|webp|gif|pdf)$/i', $basename)) {
            continue;
        }

        if (empty($_SESSION['receipt_uploads'][$basename])) {
            continue;
        }

        $stmt = $pdo->prepare('SELECT id FROM expenses WHERE LOCATE(?, receipt_url) > 0 LIMIT 1');
        $stmt->execute([$basename]);

        if ($stmt->fetch()) {
            continue;
        }

        $filePath = __DIR__ . '/../storage/receipts/' . $basename;

        if (is_file($filePath)) {
            unlink($filePath);
            unset($_SESSION['receipt_uploads'][$basename]);
            $deleted[] = '/receipt.php?file=' . rawurlencode($basename);
        }
    }

    json_response([
        'success' => true,
        'deleted' => $deleted,
        'count' => count($deleted),
        'message' => count($deleted) . ' uncommitted receipt(s) removed from storage'
    ]);
}

function expenses_cleanup_orphaned_uploads($maxAgeSeconds = 7200) {
    $uploadDir = realpath(__DIR__ . '/../storage/receipts');
    if (!$uploadDir || !is_dir($uploadDir)) return;

    try {
        $pdo = get_db_connection();
        $files = scandir($uploadDir);
        $now = time();
        foreach ($files as $f) {
            if ($f === '.' || $f === '..' || str_starts_with($f, '.')) continue;
            if (!preg_match('/^[a-zA-Z0-9_-]+\.(jpe?g|png|webp|gif|pdf)$/i', $f)) continue;

            $full = $uploadDir . DIRECTORY_SEPARATOR . $f;
            if (!is_file($full)) continue;

            $mtime = filemtime($full);
            if ($mtime && ($now - $mtime) > $maxAgeSeconds) {
                $stmt = $pdo->prepare('SELECT id FROM expenses WHERE LOCATE(?, receipt_url) > 0 LIMIT 1');
                $stmt->execute([$f]);
                if (!$stmt->fetch()) {
                    @unlink($full);
                }
            }
        }
    } catch (Exception $e) {
        error_log($e->getMessage());
    }
}
