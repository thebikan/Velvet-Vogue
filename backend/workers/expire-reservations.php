<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
fwrite(STDERR, "Worker is not configured: business handlers belong to Phase 2.\n");
exit(78);
