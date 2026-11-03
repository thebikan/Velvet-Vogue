<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Health;

use Psr\Cache\CacheItemPoolInterface;
use VelvetVogue\Core\Database\Database;

final class Readiness
{
    /** @param \Closure(): CacheItemPoolInterface $cache */
    public function __construct(private Database $database, private \Closure $cache)
    {
    }

    public function check(): void
    {
        $this->database->execute('SELECT 1')->fetchColumn();
        $cache = ($this->cache)();
        $key = 'ready_' . bin2hex(random_bytes(8));
        $item = $cache->getItem($key)->set('ok')->expiresAfter(10);
        if (!$cache->save($item) || $cache->getItem($key)->get() !== 'ok') {
            throw new \RuntimeException('Cache unavailable');
        }
        $cache->deleteItem($key);
    }
}
