<?php

declare(strict_types=1);

use VelvetVogue\Core\Config;

return static function (callable $read, string $env): array {
    $secure = filter_var($read('SESSION_SECURE', 'true'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($secure === null) {
        throw new RuntimeException('Invalid SESSION_SECURE');
    }
    return [
        'max_body' => Config::positiveInt($read('MAX_BODY_BYTES', '1048576'), 10485760),
        'rate_limit' => Config::positiveInt($read('RATE_LIMIT', '120'), 100000),
        'session_secure' => $secure,
    ];
};
