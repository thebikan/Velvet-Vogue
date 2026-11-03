<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$failed = false;
$count = 0;
foreach (['src', 'bootstrap', 'config', 'routes', 'public', 'tests', 'workers', 'bin'] as $directory) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $directory));
    foreach ($files as $file) {
        if (!$file->isFile() || $file->getExtension() !== 'php') {
            continue;
        }
        $output = [];
        exec(escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($file->getPathname()) . ' 2>&1', $output, $status);
        if ($status !== 0) {
            fwrite(STDERR, implode("\n", $output) . "\n");
            $failed = true;
        }
        $count++;
    }
}
fwrite(STDOUT, "Linted {$count} PHP files.\n");
exit($failed ? 1 : 0);
