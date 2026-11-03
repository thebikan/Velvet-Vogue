<?php

declare(strict_types=1);

use VelvetVogue\Core\Config;

return static function (callable $read, string $env): array {
    $prefix = $env === 'testing' ? 'TEST_DB_' : 'DB_';
    return [
        'host' => $read($prefix . 'HOST', '127.0.0.1'),
        'port' => Config::positiveInt($read($prefix . 'PORT', '3306'), 65535),
        'name' => $read($prefix . 'DATABASE', $env === 'testing' ? 'velvet_vogue_test' : 'velvet_vogue'),
        'username' => $read($prefix . 'USERNAME', ''),
        'password' => $read($prefix . 'PASSWORD', ''),
        'timeout' => Config::positiveInt($read('DB_TIMEOUT', '3'), 30),
    ];
};
