<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Feature;

use PHPUnit\Framework\TestCase;

final class RuntimeDiagnosticTest extends TestCase
{
    private function runDiagnostic(bool $database): array
    {
        $entry = var_export(dirname(__DIR__, 2) . '/bin/diagnose.php', true);
        $arguments = $database ? "['diagnose.php', '--database']" : "['diagnose.php']";
        $code = '$_ENV["APP_ENV"]="invalid-secret-value"; $argv=' . $arguments . '; require ' . $entry . ';';
        $process = proc_open([PHP_BINARY, '-r', $code], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        self::assertIsResource($process);
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exit = proc_close($process);
        self::assertSame('', $errors);
        self::assertStringNotContainsString('invalid-secret-value', $output);
        return [$exit, json_decode($output, true, flags: JSON_THROW_ON_ERROR)];
    }

    public function testRuntimeInspectionWorksWithoutLoadingApplicationConfiguration(): void
    {
        [$exit, $report] = $this->runDiagnostic(false);
        self::assertSame(0, $exit);
        self::assertTrue($report['runtime_preflight_passed']);
        self::assertFalse($report['database']['checked']);
        self::assertSame(PHP_VERSION, $report['php']);
    }

    public function testDatabaseInspectionFailureDoesNotExposeConfiguration(): void
    {
        [$exit, $report] = $this->runDiagnostic(true);
        self::assertSame(1, $exit);
        self::assertFalse($report['database']['checked']);
        self::assertSame('RuntimeException', $report['database']['error_type']);
    }
}
