<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Security;

use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\InMemoryStorage;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use VelvetVogue\Core\Exceptions\HttpException;
use VelvetVogue\Core\Middleware\Authentication;
use VelvetVogue\Core\Middleware\Authorization;
use VelvetVogue\Core\Middleware\Csrf;
use VelvetVogue\Core\Middleware\RateLimit;
use VelvetVogue\Shared\Contracts\Authenticator;
use VelvetVogue\Shared\DTO\Principal;

final class MiddlewareTest extends TestCase
{
    public function testAuthenticationFailsClosed(): void
    {
        $auth = $this->createMock(Authenticator::class);
        $auth->method('authenticate')->willReturn(null);
        $this->expectException(HttpException::class);
        (new Authentication($auth))->process(Request::create('/'), fn () => new Response());
    }

    public function testAuthorizationRequiresExactPermission(): void
    {
        $request = Request::create('/');
        $request->attributes->set('principal', new Principal('1', ['catalog.read']));
        self::assertSame(200, (new Authorization('catalog.read'))->process($request, fn () => new Response())->getStatusCode());
        $this->expectException(HttpException::class);
        (new Authorization('catalog.write'))->process($request, fn () => new Response());
    }

    public function testCsrfRejectsUnsafeRequest(): void
    {
        $tokens = $this->createMock(CsrfTokenManagerInterface::class);
        $tokens->method('isTokenValid')->willReturn(false);
        $csrf = new Csrf($tokens);
        self::assertSame(200, $csrf->process(Request::create('/'), fn () => new Response())->getStatusCode());
        $this->expectException(HttpException::class);
        $csrf->process(Request::create('/', 'POST'), fn () => new Response());
    }

    public function testRateLimitAndProbeExemption(): void
    {
        $factory = new RateLimiterFactory([
            'id' => 'test', 'policy' => 'fixed_window', 'limit' => 1, 'interval' => '1 minute',
        ], new InMemoryStorage());
        $limiter = new RateLimit(fn () => $factory);
        $next = fn () => new Response();
        self::assertSame(200, $limiter->process(Request::create('/api/v1/products'), $next)->getStatusCode());
        self::assertSame(200, $limiter->process(Request::create('/api/v1/health'), $next)->getStatusCode());
        try {
            $limiter->process(Request::create('/api/v1/products'), $next);
            self::fail('Expected rate limit');
        } catch (HttpException $error) {
            self::assertSame(429, $error->status);
            self::assertArrayHasKey('Retry-After', $error->headers);
        }
    }
    public function testLivenessNeverConstructsRateStorage(): void
    {
        $limiter = new RateLimit(static function (): never {
            throw new \RuntimeException('Cache offline');
        });
        self::assertSame(200, $limiter->process(Request::create('/api/v1/health'), fn () => new Response())->getStatusCode());
    }
}
