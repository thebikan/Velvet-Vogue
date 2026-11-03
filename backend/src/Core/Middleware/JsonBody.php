<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Middleware;

use JsonException;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use VelvetVogue\Core\Exceptions\HttpException;

final class JsonBody implements Middleware
{
    public function __construct(private int $maxBytes)
    {
    }

    public function process(Request $request, callable $next): Response
    {
        $length = $request->headers->get('Content-Length');
        if ($length !== null && (!ctype_digit($length) || (float) $length > $this->maxBytes)) {
            throw new HttpException(413, 'payload_too_large', 'Request body exceeds the permitted size.');
        }
        $stream = $request->getContent(true);
        $body = stream_get_contents($stream, $this->maxBytes + 1);
        if ($body === false || strlen($body) > $this->maxBytes) {
            throw new HttpException(413, 'payload_too_large', 'Request body exceeds the permitted size.');
        }
        if ($body !== '') {
            $type = strtolower(trim(explode(';', $request->headers->get('Content-Type', ''))[0]));
            if ($type !== 'application/json') {
                throw new HttpException(415, 'unsupported_media_type', 'Use application/json.');
            }
            try {
                $decoded = json_decode($body, false, 64, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                throw new HttpException(400, 'invalid_json', 'Malformed JSON request.');
            }
            if (!$decoded instanceof \stdClass) {
                throw new HttpException(400, 'invalid_json', 'JSON body must be an object.');
            }
            $request->attributes->set('json', (array) $decoded);
        } else {
            $request->attributes->set('json', []);
        }
        return $next($request);
    }
}
