<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Http;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;
use VelvetVogue\Core\Health\Readiness;

final class ReadyController
{
    public function __construct(private Readiness $readiness, private LoggerInterface $logger)
    {
    }

    public function __invoke(Request $request): Response
    {
        try {
            $this->readiness->check();
        } catch (Throwable $error) {
            $this->logger->warning('Readiness dependency unavailable', [
                'request_id' => $request->attributes->get('request_id'), 'type' => $error::class,
            ]);
            return Json::error($request, 503, 'not_ready', 'Service is not ready.');
        }
        return Json::success($request, ['status' => 'ready']);
    }
}
