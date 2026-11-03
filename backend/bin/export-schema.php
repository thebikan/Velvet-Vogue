<?php

declare(strict_types=1);

use VelvetVogue\Core\Config;
use VelvetVogue\Core\Database\Database;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

if ($argc !== 2 || in_array($argv[1], ['--help', '-h'], true)) {
    fwrite(STDOUT, "Usage: php bin/export-schema.php <new-output.sql>\nReads table/view definitions only using configured DB_* (TEST_DB_* in testing).\n");
    exit($argc === 2 ? 0 : 64);
}

$output = $argv[1];
if (file_exists($output)) {
    fwrite(STDERR, "Output already exists; choose a new filename.\n");
    exit(73);
}

try {
    require dirname(__DIR__) . '/vendor/autoload.php';
    $database = new Database(Config::load(dirname(__DIR__)));
    $pdo = $database->connection();
    $pdo->exec('SET TRANSACTION READ ONLY');
    $pdo->beginTransaction();
    try {
        $tables = $database->execute(
            'SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_TYPE, TABLE_NAME'
        )->fetchAll();
        if ($tables === []) {
            throw new RuntimeException('No visible tables');
        }
        $definitions = [
            '-- Table/view definitions for compatibility review; no application rows exported.',
            '-- Not a complete backup: routines, triggers, events, grants and migration history are not included.',
            '-- Metadata can change during export; run while schema deployments are paused.',
        ];
        foreach ($tables as $table) {
            // Identifiers come from metadata, but still require escaping (parameters cannot bind identifiers).
            $identifier = '`' . str_replace('`', '``', $table['TABLE_NAME']) . '`';
            $type = $table['TABLE_TYPE'] === 'VIEW' ? 'VIEW' : 'TABLE';
            $definition = $database->execute('SHOW CREATE ' . $type . ' ' . $identifier)->fetch(PDO::FETCH_NUM);
            if ($definition === false || !isset($definition[1])) {
                throw new RuntimeException('Definition unavailable');
            }
            $definitions[] = $definition[1] . ';';
        }
    } finally {
        $pdo->rollBack();
    }
    $sql = implode("\n\n", $definitions) . "\n";
    $file = @fopen($output, 'x');
    if ($file === false) {
        throw new RuntimeException('Cannot create output');
    }
    try {
        if (fwrite($file, $sql) !== strlen($sql)) {
            throw new RuntimeException('Incomplete output');
        }
    } finally {
        fclose($file);
    }
    fwrite(STDOUT, sprintf("Exported %d table/view definitions. No application records or tables were changed.\n", count($tables)));
} catch (Throwable $error) {
    fwrite(STDERR, 'Export failed (' . $error::class . "). Check database access, metadata privileges and output directory.\n");
    exit(1);
}
