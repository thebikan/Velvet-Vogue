<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Logging;

use Psr\Log\AbstractLogger;
use Psr\Log\LoggerInterface;
use Stringable;
use Throwable;

/** Operational logs must not change an already completed business result. Audit writes belong in transactions. */
final class ResilientLogger extends AbstractLogger
{
    public function __construct(private LoggerInterface $inner)
    {
    }

    public function log($level, string|Stringable $message, array $context = []): void
    {
        try {
            $this->inner->log($level, $message, $context);
        } catch (Throwable) {
            // Do not forward exception messages or original log context to the fallback sink.
            error_log('{"event":"logging_sink_unavailable"}');
        }
    }
}
