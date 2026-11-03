<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Integration;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

#[Group('redis')]
final class RedisTest extends TestCase
{
    public function testReadinessAndCountersSurviveSeparateBootstraps(): void
    {
        $old = $_ENV['RATE_LIMIT'] ?? null;
        $_ENV['RATE_LIMIT'] = '1';
        try {
            $app = require dirname(__DIR__, 2) . '/bootstrap/app.php';
            self::assertSame(200, $app->handle(Request::create('/api/v1/ready'))->getStatusCode());
            $ip = '2001:db8::' . bin2hex(random_bytes(2));
            self::assertSame(404, $app->handle(Request::create('/missing', server: ['REMOTE_ADDR' => $ip]))->getStatusCode());
            $app = require dirname(__DIR__, 2) . '/bootstrap/app.php';
            $response = $app->handle(Request::create('/missing', server: ['REMOTE_ADDR' => $ip]));
            self::assertSame(429, $response->getStatusCode());
            self::assertNotNull($response->headers->get('Retry-After'));
        } finally {
            if ($old === null) {
                unset($_ENV['RATE_LIMIT']);
            } else {
                $_ENV['RATE_LIMIT'] = $old;
            }
        }
    }

    public function testRedisOutageDoesNotBreakLiveness(): void
    {
        $old = $_ENV['REDIS_URL'] ?? null;
        $_ENV['REDIS_URL'] = 'redis://127.0.0.1:1';
        try {
            $app = require dirname(__DIR__, 2) . '/bootstrap/app.php';
            self::assertSame(200, $app->handle(Request::create('/api/v1/health'))->getStatusCode());
            self::assertSame(503, $app->handle(Request::create('/api/v1/ready'))->getStatusCode());
        } finally {
            if ($old === null) {
                unset($_ENV['REDIS_URL']);
            } else {
                $_ENV['REDIS_URL'] = $old;
            }
        }
    }
}
