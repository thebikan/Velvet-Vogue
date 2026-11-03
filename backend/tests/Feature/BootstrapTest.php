<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Feature;

use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class BootstrapTest extends TestCase
{
    public function testApplicationBootsAndLivenessDoesNotNeedDatabase(): void
    {
        $app = require dirname(__DIR__, 2) . '/bootstrap/app.php';
        $response = $app->handle(Request::create('/api/v1/health'));
        self::assertSame(200, $response->getStatusCode());
    }

    public function testReadinessFailureIsSanitized(): void
    {
        $old = $_ENV['TEST_DB_PORT'] ?? null;
        $_ENV['TEST_DB_PORT'] = '1';
        try {
            $app = require dirname(__DIR__, 2) . '/bootstrap/app.php';
            $response = $app->handle(Request::create('/api/v1/ready'));
            self::assertSame(503, $response->getStatusCode());
            self::assertStringNotContainsString('SQLSTATE', $response->getContent());
            self::assertStringContainsString('not_ready', $response->getContent());
        } finally {
            if ($old === null) {
                unset($_ENV['TEST_DB_PORT']);
            } else {
                $_ENV['TEST_DB_PORT'] = $old;
            }
        }
    }
}
