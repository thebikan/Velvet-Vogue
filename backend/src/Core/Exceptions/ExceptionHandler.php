<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Exceptions;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;
use Symfony\Component\HttpFoundation\Exception\SuspiciousOperationException;
use VelvetVogue\Core\Http\Json;

final class ExceptionHandler
{
    public function __construct(private LoggerInterface $logger)
    {
    }

    public function handle(Throwable $error, Request $request): Response
    {
        if ($error instanceof SuspiciousOperationException) {
            return Json::error($request, 400, 'invalid_request', 'Invalid HTTP request.');
        }
        if ($error instanceof HttpException) {
            $response = Json::error($request, $error->status, $error->errorCode, $error->getMessage(), $error->details);
            $response->headers->add($error->headers);
            return $response;
        }
        // Exception messages, SQL, arguments and traces can contain credentials or customer data.
        $this->logger->error('Unhandled exception', [
            'request_id' => $request->attributes->get('request_id'), 'type' => $error::class,
        ]);
        return Json::error($request, 500, 'internal_error', 'An unexpected error occurred.');
    }
}
