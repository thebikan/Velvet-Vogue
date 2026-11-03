<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Exceptions;

final class ValidationException extends HttpException
{
    public function __construct(array $errors)
    {
        parent::__construct(422, 'validation_failed', 'Request validation failed.', $errors);
    }
}
