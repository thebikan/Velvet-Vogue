<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Middleware;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

interface Middleware
{
    /** @param callable(Request): Response $next */
    public function process(Request $request, callable $next): Response;
}
