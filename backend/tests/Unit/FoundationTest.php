<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Unit;

use DI\Container;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validation;
use VelvetVogue\Core\Config;
use VelvetVogue\Core\Exceptions\ExceptionHandler;
use VelvetVogue\Core\Exceptions\ValidationException;
use VelvetVogue\Core\Http\HealthController;
use VelvetVogue\Core\Http\Json;
use VelvetVogue\Core\Http\Kernel;
use VelvetVogue\Core\Middleware\JsonBody;
use VelvetVogue\Core\Routing\Router;
use VelvetVogue\Core\Validation\Validator;

final class FoundationTest extends TestCase
{
    private function kernel(): Kernel
    {
        $container = new Container();
        $container->set('echo', new class {
            public function __invoke(Request $request): Response
            {
                return Json::success($request, $request->attributes->get('json'));
            }
        });
        $container->set('broken', new class {
            public function __invoke(Request $request): never
            {
                throw new \RuntimeException('password=secret');
            }
        });
        $router = new Router($container);
        $router->add('health', '/api/v1/health', ['GET', 'HEAD'], HealthController::class);
        $router->add('echo', '/api/v1/echo', ['POST'], 'echo');
        $router->add('broken', '/broken', ['GET'], 'broken');
        return new Kernel($router, new ExceptionHandler(new NullLogger()), new NullLogger(), [new JsonBody(128)]);
    }

    public function testRoutingAndContract(): void
    {
        $response = $this->kernel()->handle(Request::create('/api/v1/health?probe=1'));
        self::assertSame(200, $response->getStatusCode());
        $body = json_decode($response->getContent(), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('alive', $body['data']['status']);
        self::assertNull($body['error']);
        self::assertSame($response->headers->get('X-Request-ID'), $body['meta']['request_id']);
        self::assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        self::assertSame('', $this->kernel()->handle(Request::create('/api/v1/health', 'HEAD'))->getContent());
    }

    public function testMissingAndMethodErrors(): void
    {
        self::assertSame(404, $this->kernel()->handle(Request::create('/missing'))->getStatusCode());
        $response = $this->kernel()->handle(Request::create('/api/v1/health', 'POST'));
        self::assertSame(405, $response->getStatusCode());
        self::assertStringContainsString('GET', $response->headers->get('Allow'));
    }

    public function testBodyValidation(): void
    {
        foreach (
            [['{}', 'application/json', 200], ['{"a":1}', 'application/json; charset=utf-8', 200],
            ['{', 'application/json', 400], ['[]', 'application/json', 400],
            ['abc', 'text/plain', 415], [str_repeat('x', 129), 'application/json', 413]] as [$body, $type, $status]
        ) {
            $request = Request::create('/api/v1/echo', 'POST', server: ['CONTENT_TYPE' => $type], content: $body);
            self::assertSame($status, $this->kernel()->handle($request)->getStatusCode());
        }
    }

    public function testExceptionDoesNotLeakSecrets(): void
    {
        $response = $this->kernel()->handle(Request::create('/broken'));
        self::assertSame(500, $response->getStatusCode());
        self::assertStringNotContainsString('secret', $response->getContent());
        self::assertNotNull($response->headers->get('X-Request-ID'));
    }

    public function testValidationErrorsAreCentralized(): void
    {
        $this->expectException(ValidationException::class);
        (new Validator(Validation::createValidator()))->validate('', new Assert\NotBlank());
    }

    public function testConfigurationLoadsTestingIsolation(): void
    {
        $config = Config::load(dirname(__DIR__, 2));
        self::assertSame('testing', $config->get('app', 'env'));
        self::assertStringEndsWith('_test', $config->get('database', 'name'));
    }

    public function testInvalidConfigurationIsRejected(): void
    {
        $this->expectException(\RuntimeException::class);
        Config::positiveInt('0');
    }
    public function testDeclaredBodyLimitAndUntrustedHeaders(): void
    {
        $request = Request::create('/api/v1/health', server: [
            'CONTENT_LENGTH' => '1000000', 'HTTP_X_REQUEST_ID' => 'attacker',
            'HTTP_X_FORWARDED_FOR' => '192.0.2.1', 'REMOTE_ADDR' => '127.0.0.1',
        ]);
        $response = $this->kernel()->handle($request);
        self::assertSame(413, $response->getStatusCode());
        self::assertNotSame('attacker', $response->headers->get('X-Request-ID'));
        self::assertSame('127.0.0.1', $request->getClientIp());
    }

    public function testUnsafeTestDatabaseNameIsRejected(): void
    {
        $old = $_ENV['TEST_DB_DATABASE'] ?? null;
        $_ENV['TEST_DB_DATABASE'] = 'production';
        try {
            $this->expectException(\RuntimeException::class);
            Config::load(dirname(__DIR__, 2));
        } finally {
            if ($old === null) {
                unset($_ENV['TEST_DB_DATABASE']);
            } else {
                $_ENV['TEST_DB_DATABASE'] = $old;
            }
        }
    }
}
