<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Middleware;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use VelvetVogue\Core\Exceptions\HttpException;
use VelvetVogue\Shared\Contracts\Authenticator;

final class Authentication implements Middleware
{
    public function __construct(private Authenticator $authenticator)
    {
    }

    public function process(Request $request, callable $next): Response
    {
        $principal = $this->authenticator->authenticate($request);
        if ($principal === null) {
            throw new HttpException(401, 'unauthenticated', 'Authentication required.');
        }
        $request->attributes->set('principal', $principal);
        return $next($request);
    }
}
