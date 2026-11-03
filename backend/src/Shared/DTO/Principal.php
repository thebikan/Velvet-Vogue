<?php

declare(strict_types=1);

namespace VelvetVogue\Shared\DTO;

final readonly class Principal
{
    public function __construct(public string $id, public array $permissions = [])
    {
    }
}
