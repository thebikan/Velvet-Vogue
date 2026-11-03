<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Middleware;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use VelvetVogue\Core\Exceptions\HttpException;
use VelvetVogue\Shared\DTO\Principal;

final class Authorization implements Middleware
{
    public function __construct(private string $permission)
    {
    }

    public function process(Request $request, callable $next): Response
    {
        $principal = $request->attributes->get('principal');
        if (!$principal instanceof Principal) {
            throw new HttpException(401, 'unauthenticated', 'Authentication required.');
        }
        if (!in_array($this->permission, $principal->permissions, true)) {
            throw new HttpException(403, 'forbidden', 'Permission denied.');
        }
        return $next($request);
    }
}
