<?php

declare(strict_types=1);

return static fn (callable $read, string $env): array => [
    'driver' => $read('CACHE_DRIVER', 'file'),
    'url' => $read('REDIS_URL', ''),
];
