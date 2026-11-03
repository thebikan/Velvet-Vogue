<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Middleware;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use VelvetVogue\Core\Config;

/** Opt-in only: attach before Authentication and Csrf on cookie-authenticated routes. */
final class CookieSession implements Middleware
{
    public function __construct(private Config $config)
    {
    }

    public function process(Request $request, callable $next): Response
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_name('vv_session');
            if (
                !session_start([
                'use_strict_mode' => 1, 'use_only_cookies' => 1,
                'cookie_httponly' => true, 'cookie_secure' => $this->config->get('security', 'session_secure'),
                'cookie_samesite' => 'Lax', 'cookie_path' => '/',
                ])
            ) {
                throw new \RuntimeException('Unable to start session');
            }
        }
        try {
            return $next($request);
        } finally {
            session_write_close();
        }
    }
}
