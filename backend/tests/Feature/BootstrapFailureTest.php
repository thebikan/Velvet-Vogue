<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Feature;

use PHPUnit\Framework\TestCase;

final class BootstrapFailureTest extends TestCase
{
    private function boot(string $method): string
    {
        $entry = var_export(dirname(__DIR__, 2) . '/public/index.php', true);
        $code = '$_ENV["APP_ENV"]="invalid-secret"; $_SERVER["REQUEST_METHOD"]=' . var_export($method, true) . '; require ' . $entry . ';';
        $process = proc_open([PHP_BINARY, '-r', $code], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        self::assertIsResource($process);
        $body = stream_get_contents($pipes[1]);
        $diagnostic = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        self::assertSame(0, proc_close($process));
        self::assertStringNotContainsString('invalid-secret', $diagnostic);
        return $body;
    }

    public function testBootstrapFailureUsesSanitizedEnvelope(): void
    {
        $body = json_decode($this->boot('GET'), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('internal_error', $body['error']['code']);
        self::assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $body['meta']['request_id']);
    }

    public function testBootstrapFailureHeadHasNoBody(): void
    {
        self::assertSame('', $this->boot('HEAD'));
    }
}
