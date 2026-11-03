<?php

declare(strict_types=1);

namespace VelvetVogue\Shared\Contracts;

interface Queue
{
    /** Implementations must bound payload size and guarantee idempotent delivery handling. */
    public function dispatch(string $type, array $payload, string $idempotencyKey): void;
}
