<?php

date_default_timezone_set('Asia/Karachi');

$local_config = [];
$local_file = __DIR__ . '/local.php';

if (is_file($local_file)) {
    $local_config = require $local_file;
}

define('APP_NAME', 'Hostribe');
define('APP_URL', rtrim(getenv('APP_URL') ?: ($local_config['APP_URL'] ?? 'http://hostribe.local'), '/'));

define('DB_HOST', getenv('DB_HOST') ?: ($local_config['DB_HOST'] ?? '127.0.0.1'));
define('DB_PORT', getenv('DB_PORT') ?: ($local_config['DB_PORT'] ?? '3306'));
define('DB_NAME', getenv('DB_NAME') ?: ($local_config['DB_NAME'] ?? 'hostribe'));
define('DB_USER', getenv('DB_USER') ?: ($local_config['DB_USER'] ?? 'abdullah'));
define('DB_PASS', getenv('DB_PASS') ?: ($local_config['DB_PASS'] ?? '2005'));
define('DB_CHARSET', 'utf8mb4');

define('SMTP_ENABLED', filter_var(getenv('SMTP_ENABLED') ?: ($local_config['SMTP_ENABLED'] ?? false), FILTER_VALIDATE_BOOLEAN));
define('SMTP_HOST', getenv('SMTP_HOST') ?: ($local_config['SMTP_HOST'] ?? 'smtp.gmail.com'));
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: ($local_config['SMTP_PORT'] ?? 587)));
define('SMTP_ENCRYPTION', getenv('SMTP_ENCRYPTION') ?: ($local_config['SMTP_ENCRYPTION'] ?? 'tls'));
define('SMTP_USER', getenv('SMTP_USER') ?: ($local_config['SMTP_USER'] ?? ''));
define('SMTP_PASS', getenv('SMTP_PASS') ?: ($local_config['SMTP_PASS'] ?? ''));
define('SMTP_FROM', getenv('SMTP_FROM') ?: ($local_config['SMTP_FROM'] ?? SMTP_USER));
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME') ?: ($local_config['SMTP_FROM_NAME'] ?? APP_NAME));

function smtp_send_mail($to, $subject, $html_message, $text_message = '') {
    if (!SMTP_ENABLED || SMTP_USER === '' || SMTP_PASS === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $host = SMTP_ENCRYPTION === 'ssl' ? 'ssl://' . SMTP_HOST : SMTP_HOST;
    $socket = @fsockopen($host, SMTP_PORT, $error_number, $error_message, 10);

    if (!$socket) {
        return false;
    }

    $read = function() use ($socket) {
        $response = '';

        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }

        return $response;
    };

    $send = function($command) use ($socket) {
        fwrite($socket, $command . "\r\n");
    };

    $response = $read();

    if (substr($response, 0, 3) !== '220') {
        fclose($socket);
        return false;
    }

    $send('EHLO ' . gethostname());
    $response = $read();

    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return false;
    }

    if (SMTP_ENCRYPTION === 'tls') {
        $send('STARTTLS');
        $response = $read();

        if (substr($response, 0, 3) !== '220' || !stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return false;
        }

        $send('EHLO ' . gethostname());
        $response = $read();

        if (substr($response, 0, 3) !== '250') {
            fclose($socket);
            return false;
        }
    }

    $send('AUTH LOGIN');
    $response = $read();

    if (substr($response, 0, 3) !== '334') {
        fclose($socket);
        return false;
    }

    $send(base64_encode(SMTP_USER));
    $response = $read();

    if (substr($response, 0, 3) !== '334') {
        fclose($socket);
        return false;
    }

    $send(base64_encode(SMTP_PASS));
    $response = $read();

    if (substr($response, 0, 3) !== '235') {
        fclose($socket);
        return false;
    }

    $from = SMTP_FROM ?: SMTP_USER;
    $clean_subject = str_replace(["\r", "\n"], '', $subject);
    $boundary = bin2hex(random_bytes(16));

    $send('MAIL FROM: <' . $from . '>');
    $response = $read();

    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return false;
    }

    $send('RCPT TO: <' . $to . '>');
    $response = $read();

    if (!in_array(substr($response, 0, 3), ['250', '251'], true)) {
        fclose($socket);
        return false;
    }

    $send('DATA');
    $response = $read();

    if (substr($response, 0, 3) !== '354') {
        fclose($socket);
        return false;
    }

    $headers = "From: " . SMTP_FROM_NAME . " <{$from}>\r\n";
    $headers .= "To: <{$to}>\r\n";
    $headers .= "Subject: {$clean_subject}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n\r\n";

    $body = "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $body .= ($text_message ?: strip_tags($html_message)) . "\r\n\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
    $body .= $html_message . "\r\n\r\n";
    $body .= "--{$boundary}--\r\n.";

    $send($headers . $body);
    $response = $read();

    $send('QUIT');
    fclose($socket);

    return substr($response, 0, 3) === '250';
}

function send_app_mail($to, $subject, $html_message, $text_message = '') {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    if (SMTP_ENABLED && smtp_send_mail($to, $subject, $html_message, $text_message)) {
        return true;
    }

    $clean_subject = str_replace(["\r", "\n"], '', $subject);
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . SMTP_FROM_NAME . " <" . (SMTP_FROM ?: 'noreply@hostribe.local') . ">\r\n";

    return mail($to, $clean_subject, $html_message, $headers);
}
