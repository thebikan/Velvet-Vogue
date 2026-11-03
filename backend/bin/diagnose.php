<?php

declare(strict_types=1);

// Standalone CLI preflight: can run before Composer dependencies are installed.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$extensions = [
    'pdo', 'pdo_mysql', 'json', 'mbstring', 'ctype', 'iconv', 'session', 'tokenizer',
    'dom', 'xml', 'xmlwriter', 'simplexml', 'filter', 'libxml', 'phar',
];
$available = [];
foreach ($extensions as $extension) {
    $available[$extension] = extension_loaded($extension);
}
$compatible = version_compare((string) phpversion(), '8.2', '>=') && version_compare((string) phpversion(), '8.5', '<') && !in_array(false, $available, true);
$report = [
    'php' => PHP_VERSION,
    'os' => PHP_OS_FAMILY,
    'sapi' => PHP_SAPI,
    'php_ini' => php_ini_loaded_file(),
    'extensions' => $available,
    'password_algorithms' => password_algos(),
    'runtime_preflight_passed' => $compatible,
    'note' => 'CLI runtime only. Verify Apache PHP separately; run composer check-platform-reqs after install.',
    'database' => ['checked' => false],
];

if (in_array('--database', $argv, true)) {
    try {
        require dirname(__DIR__) . '/vendor/autoload.php';
        $database = new VelvetVogue\Core\Database\Database(VelvetVogue\Core\Config::load(dirname(__DIR__)));
        $row = $database->execute('SELECT VERSION() AS version, @@version_comment AS comment, @@sql_mode AS sql_mode')->fetch();
        $tables = $database->execute(
            'SELECT TABLE_NAME AS name, TABLE_TYPE AS type, ENGINE AS engine, TABLE_COLLATION AS collation '
            . 'FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME'
        )->fetchAll();
        $report['database'] = [
            'checked' => true,
            'server_version' => $row['version'],
            'engine' => stripos($row['version'] . ' ' . $row['comment'], 'mariadb') !== false ? 'MariaDB' : 'MySQL-compatible (verify vendor)',
            'sql_mode' => $row['sql_mode'],
            'tables' => $tables,
            'schema_compatibility_verified' => false,
        ];
    } catch (Throwable $error) {
        $report['database'] = ['checked' => false, 'error_type' => $error::class, 'message' => 'Check dependencies and local DB configuration; no credentials are printed.'];
        $compatible = false;
    }
}
fwrite(STDOUT, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n");
exit($compatible ? 0 : 1);
