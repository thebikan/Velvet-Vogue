<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Security;

use DI\Container;
use PHPUnit\Framework\TestCase;
use Psr\Log\AbstractLogger;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use VelvetVogue\Core\Exceptions\ExceptionHandler;
use VelvetVogue\Core\Exceptions\HttpException;
use VelvetVogue\Core\Http\HealthController;
use VelvetVogue\Core\Http\Kernel;
use VelvetVogue\Core\Logging\ResilientLogger;
use VelvetVogue\Core\Middleware\RateLimit;
use VelvetVogue\Core\Routing\Router;

final class AuditRegressionTest extends TestCase
{
    private function logger(): LoggerInterface
    {
        return new ResilientLogger(new class extends AbstractLogger {
            public function log($level, string|\Stringable $message, array $context = []): void
            {
                throw new \RuntimeException('Simulated disk failure with secret diagnostic');
            }
        });
    }

    public function testBrokenLogSinkDoesNotReplaceSuccessfulResponse(): void
    {
        $router = new Router(new Container());
        $router->add('health', '/api/v1/health', ['GET'], HealthController::class);
        $logger = $this->logger();
        $app = new Kernel($router, new ExceptionHandler($logger), $logger);
        $response = $app->handle(Request::create('/api/v1/health'));
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('alive', $response->getContent());
    }

    public function testExceptionHandlerStillSanitizesWhenLoggingFails(): void
    {
        $response = (new ExceptionHandler($this->logger()))->handle(new \RuntimeException('password=secret'), Request::create('/'));
        self::assertSame(500, $response->getStatusCode());
        self::assertStringNotContainsString('secret', $response->getContent());
    }

    public function testRateLimiterOutageRejectsWithoutCallingController(): void
    {
        $middleware = new RateLimit(static function (): never {
            throw new \RuntimeException('Redis secret');
        });
        try {
            $middleware->process(Request::create('/api/v1/products'), static function (): Response {
                self::fail('The controller must not execute when throttling cannot be enforced');
            });
            self::fail('Expected unavailable error');
        } catch (HttpException $error) {
            self::assertSame(503, $error->status);
            self::assertSame('1', $error->headers['Retry-After']);
            self::assertStringNotContainsString('secret', $error->getMessage());
        }
    }

    public function testMalformedHostReturnsClientError(): void
    {
        $router = new Router(new Container());
        $router->add('health', '/api/v1/health', ['GET'], HealthController::class);
        $logger = $this->logger();
        $app = new Kernel($router, new ExceptionHandler($logger), $logger);
        $response = $app->handle(Request::create('/api/v1/health', server: ['HTTP_HOST' => 'invalid/host']));
        self::assertSame(400, $response->getStatusCode());
        self::assertNotNull($response->headers->get('X-Request-ID'));
    }
}
