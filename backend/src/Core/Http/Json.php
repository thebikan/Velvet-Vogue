<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Http;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class Json
{
    public static function success(Request $request, mixed $data, int $status = 200): JsonResponse
    {
        return new JsonResponse(['data' => $data, 'error' => null, 'meta' => self::meta($request)], $status);
    }

    public static function error(Request $request, int $status, string $code, string $message, array $details = []): JsonResponse
    {
        return new JsonResponse([
            'data' => null,
            'error' => ['code' => $code, 'message' => $message, 'details' => (object) $details],
            'meta' => self::meta($request),
        ], $status);
    }

    private static function meta(Request $request): array
    {
        return ['request_id' => $request->attributes->get('request_id')];
    }
}
