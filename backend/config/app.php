<?php

declare(strict_types=1);

return static fn (callable $read, string $env): array => [
    'env' => $env,
    'name' => $read('APP_NAME', 'Velvet Vogue'),
    'log_target' => $read('LOG_TARGET', 'auto'),
    'log_level' => $read('LOG_LEVEL', 'info'),
];
