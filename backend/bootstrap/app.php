<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use Psr\Cache\CacheItemPoolInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\Cache\Adapter\RedisAdapter;
use Symfony\Component\Lock\LockFactory;
use Symfony\Component\Lock\Store\FlockStore;
use Symfony\Component\Lock\Store\RedisStore;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\CacheStorage;
use Symfony\Component\Security\Csrf\CsrfTokenManager;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use VelvetVogue\Core\Config;
use VelvetVogue\Core\Exceptions\ExceptionHandler;
use VelvetVogue\Core\Http\Kernel;
use VelvetVogue\Core\Logging\LoggerFactory;
use VelvetVogue\Core\Middleware\JsonBody;
use VelvetVogue\Core\Middleware\RateLimit;
use VelvetVogue\Core\Routing\Router;
use VelvetVogue\Shared\Contracts\Authenticator;
use VelvetVogue\Shared\DTO\Principal;
use Symfony\Component\HttpFoundation\Request;

require_once dirname(__DIR__) . '/vendor/autoload.php';
$root = dirname(__DIR__);
$config = Config::load($root);
$builder = new ContainerBuilder();
$builder->addDefinitions([
    Config::class => $config,
    LoggerInterface::class => DI\factory(fn () => LoggerFactory::create($config, $root)),
    CacheItemPoolInterface::class => DI\factory(static function () use ($config, $root) {
        if ($config->get('cache', 'driver') === 'redis') {
            $connection = RedisAdapter::createConnection($config->get('cache', 'url'), ['lazy' => true, 'timeout' => 2, 'read_timeout' => 2]);
            return new RedisAdapter($connection, 'vv_' . $config->get('app', 'env'));
        }
        return new FilesystemAdapter('vv_' . $config->get('app', 'env'), 120, $root . '/storage/temp/cache');
    }),
    LockFactory::class => DI\factory(static function () use ($config, $root) {
        $store = $config->get('cache', 'driver') === 'redis'
            ? new RedisStore(RedisAdapter::createConnection($config->get('cache', 'url'), ['lazy' => true, 'timeout' => 2, 'read_timeout' => 2]))
            : new FlockStore($root . '/storage/temp');
        return new LockFactory($store);
    }),
    VelvetVogue\Core\Health\Readiness::class => DI\factory(
        fn (VelvetVogue\Core\Database\Database $db, Psr\Container\ContainerInterface $container) => new VelvetVogue\Core\Health\Readiness(
            $db,
            fn () => $container->get(CacheItemPoolInterface::class),
        ),
    ),
    RateLimit::class => DI\factory(fn (Psr\Container\ContainerInterface $container) => new RateLimit(
        fn () => $container->get(RateLimiterFactory::class),
    )),
    RateLimiterFactory::class => DI\factory(static fn (CacheItemPoolInterface $cache, LockFactory $locks) => new RateLimiterFactory([
        'id' => 'api_' . $config->get('app', 'env'), 'policy' => 'fixed_window',
        'limit' => $config->get('security', 'rate_limit'), 'interval' => '1 minute',
    ], new CacheStorage($cache), $locks)),
    JsonBody::class => DI\factory(fn () => new JsonBody($config->get('security', 'max_body'))),
    ValidatorInterface::class => DI\factory(fn () => Validation::createValidator()),
    CsrfTokenManagerInterface::class => DI\factory(fn () => new CsrfTokenManager()),
    // Fail closed until the schema-backed authentication service is implemented in Phase 2.
    Authenticator::class => DI\factory(fn () => new class implements Authenticator {
        public function authenticate(Request $request): ?Principal
        {
            return null;
        }
    }),
]);
$container = $builder->build();
$router = new Router($container);
(require $root . '/routes/api.php')($router);
(require $root . '/routes/web.php')($router);
return new Kernel($router, $container->get(ExceptionHandler::class), $container->get(LoggerInterface::class), [
    $container->get(JsonBody::class), $container->get(RateLimit::class),
]);
