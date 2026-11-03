<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Http;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;
use VelvetVogue\Core\Exceptions\ExceptionHandler;
use VelvetVogue\Core\Middleware\Middleware;
use VelvetVogue\Core\Routing\Router;

final class Kernel
{
    /** @param list<Middleware> $middleware */
    public function __construct(
        private Router $router,
        private ExceptionHandler $errors,
        private LoggerInterface $logger,
        private array $middleware = [],
    ) {
    }

    public function handle(Request $request): Response
    {
        $start = hrtime(true);
        // Generate server-owned identifiers: never trust client-supplied correlation values.
        $request->attributes->set('request_id', bin2hex(random_bytes(16)));
        try {
            $next = fn (Request $r): Response => $this->router->dispatch($r);
            foreach (array_reverse($this->middleware) as $middleware) {
                $downstream = $next;
                $next = fn (Request $r): Response => $middleware->process($r, $downstream);
            }
            $response = $next($request);
        } catch (Throwable $error) {
            $response = $this->errors->handle($error, $request);
        }
        $response->headers->add([
            'X-Request-ID' => $request->attributes->get('request_id'),
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'no-referrer',
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'",
            'Cache-Control' => 'no-store',
        ]);
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }
        $this->logger->info('HTTP request', [
            'request_id' => $request->attributes->get('request_id'),
            'method' => $request->getMethod(),
            'route' => $request->attributes->get('_route', 'unmatched'),
            'status' => $response->getStatusCode(),
            'duration_ms' => round((hrtime(true) - $start) / 1e6, 2),
        ]);
        return $response->prepare($request);
    }
}
