<?php

declare(strict_types=1);

namespace VelvetVogue\Tests\Integration;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use VelvetVogue\Core\Config;
use VelvetVogue\Core\Database\Database;

#[Group('database')]
final class DatabaseTest extends TestCase
{
    private Database $database;

    protected function setUp(): void
    {
        $config = Config::load(dirname(__DIR__, 2));
        if ($config->get('app', 'env') !== 'testing' || !str_ends_with($config->get('database', 'name'), '_test')) {
            throw new \RuntimeException('Refusing unsafe test database');
        }
        $this->database = new Database($config);
        // Connection-local table only; never modifies application tables.
        $this->database->execute('CREATE TEMPORARY TABLE foundation_probe (id INT PRIMARY KEY, value VARCHAR(100)) ENGINE=InnoDB');
    }

    public function testConnectionAndPreparedStatements(): void
    {
        self::assertSame($this->database->connection(), $this->database->connection());
        self::assertSame(1, (int) $this->database->execute('SELECT 1')->fetchColumn());
        $value = "quote'; DROP TABLE users; --";
        $this->database->execute('INSERT INTO foundation_probe VALUES (?, ?)', [1, $value]);
        self::assertSame($value, $this->database->execute('SELECT value FROM foundation_probe WHERE id = ?', [1])->fetchColumn());
    }

    public function testCommitAndRollback(): void
    {
        $this->database->transaction(fn (Database $db) => $db->execute('INSERT INTO foundation_probe VALUES (?, ?)', [1, 'committed']));
        try {
            $this->database->transaction(function (Database $db): void {
                $db->execute('INSERT INTO foundation_probe VALUES (?, ?)', [2, 'rolled back']);
                throw new \RuntimeException('force rollback');
            });
            self::fail('Expected exception');
        } catch (\RuntimeException $error) {
            self::assertSame('force rollback', $error->getMessage());
        }
        self::assertSame(1, (int) $this->database->execute('SELECT COUNT(*) FROM foundation_probe')->fetchColumn());
        self::assertFalse($this->database->connection()->inTransaction());
    }

    public function testNestedTransactionRollsBackOuter(): void
    {
        try {
            $this->database->transaction(function (Database $db): void {
                $db->execute('INSERT INTO foundation_probe VALUES (?, ?)', [3, 'nested']);
                $db->transaction(fn () => null);
            });
            self::fail('Expected nested transaction rejection');
        } catch (\LogicException) {
            self::assertSame(0, (int) $this->database->execute('SELECT COUNT(*) FROM foundation_probe')->fetchColumn());
        }
    }
}
