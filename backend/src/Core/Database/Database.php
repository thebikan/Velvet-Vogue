<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Database;

use PDO;
use PDOStatement;
use LogicException;
use Throwable;
use VelvetVogue\Core\Config;

final class Database
{
    private ?PDO $connection = null;

    public function __construct(private Config $config)
    {
    }

    public function connection(): PDO
    {
        if ($this->connection === null) {
            $c = $this->config;
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                $c->get('database', 'host'),
                $c->get('database', 'port'),
                $c->get('database', 'name')
            );
            $this->connection = new PDO($dsn, $c->get('database', 'username'), $c->get('database', 'password'), [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false,
                PDO::ATTR_TIMEOUT => $c->get('database', 'timeout'),
                PDO::MYSQL_ATTR_MULTI_STATEMENTS => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET SESSION sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION', time_zone='+00:00'",
            ]);
        }
        return $this->connection;
    }

    public function execute(string $sql, array $parameters = []): PDOStatement
    {
        $statement = $this->connection()->prepare($sql);
        foreach ($parameters as $key => $value) {
            $type = match (true) {
                is_int($value) => PDO::PARAM_INT,
                is_bool($value) => PDO::PARAM_BOOL,
                $value === null => PDO::PARAM_NULL,
                default => PDO::PARAM_STR,
            };
            $statement->bindValue(is_int($key) ? $key + 1 : $key, $value, $type);
        }
        $statement->execute();
        return $statement;
    }

    /** Callbacks must contain DML only; MySQL DDL implicitly commits. Nested transactions are rejected. */
    public function transaction(callable $callback): mixed
    {
        $pdo = $this->connection();
        if ($pdo->inTransaction()) {
            throw new LogicException('Nested transactions are not supported');
        }
        $pdo->beginTransaction();
        try {
            $result = $callback($this);
            if (!$pdo->inTransaction()) {
                throw new LogicException('Transaction ended inside callback; DDL and manual commits are forbidden');
            }
            $pdo->commit();
            return $result;
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }
}
