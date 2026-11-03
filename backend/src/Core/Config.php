<?php

declare(strict_types=1);

namespace VelvetVogue\Core;

use Dotenv\Dotenv;
use RuntimeException;

final class Config
{
    public function __construct(private array $values)
    {
    }

    public static function load(string $root): self
    {
        Dotenv::createImmutable($root)->safeLoad();
        $read = static function (string $key, string $default = ''): string {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
            return $value === false ? $default : (string) $value;
        };
        $env = $read('APP_ENV', 'local');
        if (!in_array($env, ['local', 'testing', 'staging', 'production'], true)) {
            throw new RuntimeException('Invalid APP_ENV');
        }
        $settings = [];
        foreach (['app', 'database', 'cache', 'security'] as $file) {
            $settings[$file] = (require $root . '/config/' . $file . '.php')($read, $env);
        }
        if ($env === 'testing' && !str_ends_with($settings['database']['name'], '_test')) {
            throw new RuntimeException('Testing database must end in _test');
        }
        if (in_array($env, ['staging', 'production'], true)) {
            if (
                $settings['database']['password'] === '' || $settings['cache']['driver'] !== 'redis'
                || !$settings['security']['session_secure']
            ) {
                throw new RuntimeException('Deployed environments require database credentials, Redis and secure sessions');
            }
        }
        foreach (['host', 'name'] as $key) {
            if (!preg_match('/\A[a-zA-Z0-9_.:-]+\z/', $settings['database'][$key])) {
                throw new RuntimeException('Invalid database configuration');
            }
        }
        if (!in_array($settings['cache']['driver'], ['file', 'redis'], true)) {
            throw new RuntimeException('Unsupported cache driver');
        }
        if ($settings['cache']['driver'] === 'redis' && $settings['cache']['url'] === '') {
            throw new RuntimeException('REDIS_URL is required');
        }
        return new self($settings);
    }

    public static function positiveInt(string $value, int $max = PHP_INT_MAX): int
    {
        $result = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => $max]]);
        if ($result === false) {
            throw new RuntimeException('Expected a positive integer configuration value');
        }
        return $result;
    }

    public function get(string $section, string $key): mixed
    {
        if (!isset($this->values[$section]) || !array_key_exists($key, $this->values[$section])) {
            throw new RuntimeException('Unknown configuration key');
        }
        return $this->values[$section][$key];
    }
}
