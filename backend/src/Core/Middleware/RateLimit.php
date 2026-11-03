<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Middleware;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use VelvetVogue\Core\Exceptions\HttpException;

final class RateLimit implements Middleware
{
    /** @param \Closure(): RateLimiterFactory $factory */
    public function __construct(private \Closure $factory)
    {
    }

    public function process(Request $request, callable $next): Response
    {
        // Probes must remain independent of the limiter cache dependency.
        if (in_array($request->getPathInfo(), ['/api/v1/health', '/api/v1/ready'], true)) {
            return $next($request);
        }
        try {
            $limit = ($this->factory)()->create(hash('sha256', $request->getClientIp() ?? 'unknown'))->consume();
        } catch (\Throwable) {
            // Fail closed without misclassifying a dependency outage as an application defect.
            throw new HttpException(503, 'rate_limit_unavailable', 'Service temporarily unavailable.', headers: ['Retry-After' => '1']);
        }
        if (!$limit->isAccepted()) {
            throw new HttpException(429, 'rate_limited', 'Too many requests.', headers: [
                'Retry-After' => (string) max(1, $limit->getRetryAfter()->getTimestamp() - time()),
            ]);
        }
        return $next($request);
    }
}
