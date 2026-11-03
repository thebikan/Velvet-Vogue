<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Middleware;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use VelvetVogue\Core\Exceptions\HttpException;

/** Attach to every cookie-authenticated route, after session middleware. */
final class Csrf implements Middleware
{
    public function __construct(private CsrfTokenManagerInterface $tokens)
    {
    }

    public function process(Request $request, callable $next): Response
    {
        if (!$request->isMethodSafe() && !$this->tokens->isTokenValid(new CsrfToken('api', $request->headers->get('X-CSRF-Token', '')))) {
            throw new HttpException(403, 'csrf_failed', 'Invalid CSRF token.');
        }
        return $next($request);
    }
}
