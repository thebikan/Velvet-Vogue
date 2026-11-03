<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Validation;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use VelvetVogue\Core\Exceptions\ValidationException;

final class Validator
{
    public function __construct(private ValidatorInterface $validator)
    {
    }

    public function validate(mixed $value, Constraint|array $constraints): void
    {
        $errors = [];
        foreach ($this->validator->validate($value, $constraints) as $violation) {
            // Do not echo submitted values in messages (passwords/tokens may be validated).
            $errors[$violation->getPropertyPath()][] = 'Invalid value.';
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }
    }
}
