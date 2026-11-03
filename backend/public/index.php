<?php

declare(strict_types=1);

use Symfony\Component\HttpFoundation\Request;

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_secure', '1');
ini_set('session.cookie_samesite', 'Lax');

try {
    $app = require dirname(__DIR__) . '/bootstrap/app.php';
    $app->handle(Request::createFromGlobals())->send();
} catch (Throwable $error) {
    // Bootstrap failures must not expose secrets, stack traces or dependency diagnostics.
    $id = bin2hex(random_bytes(16));
    error_log(json_encode(['event' => 'bootstrap_failure', 'request_id' => $id, 'type' => $error::class], JSON_THROW_ON_ERROR));
    http_response_code(500);
    header('Content-Type: application/json');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Request-ID: ' . $id);
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
        exit;
    }
    echo json_encode([
        'data' => null,
        'error' => ['code' => 'internal_error', 'message' => 'Service unavailable.', 'details' => new stdClass()],
        'meta' => ['request_id' => $id],
    ], JSON_THROW_ON_ERROR);
}
