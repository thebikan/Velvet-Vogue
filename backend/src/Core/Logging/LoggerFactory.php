<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Logging;

use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Psr\Log\LoggerInterface;
use VelvetVogue\Core\Config;

final class LoggerFactory
{
    public static function create(Config $config, string $root): LoggerInterface
    {
        $target = $config->get('app', 'log_target');
        $stderr = $target === 'stderr' || ($target === 'auto' && in_array($config->get('app', 'env'), ['testing', 'staging', 'production'], true));
        $level = Logger::toMonologLevel($config->get('app', 'log_level'));
        $handler = $stderr
            ? new StreamHandler('php://stderr', $level)
            : new RotatingFileHandler($root . '/storage/logs/app.log', 14, $level, true, 0640);
        $handler->setFormatter(new JsonFormatter());
        return new ResilientLogger(new Logger('velvet-vogue', [$handler]));
    }
}
