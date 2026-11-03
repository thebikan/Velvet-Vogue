<?php

declare(strict_types=1);

namespace VelvetVogue\Shared\Contracts;

use Symfony\Component\HttpFoundation\Request;
use VelvetVogue\Shared\DTO\Principal;

interface Authenticator
{
    public function authenticate(Request $request): ?Principal;
}
