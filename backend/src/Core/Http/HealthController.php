<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Http;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class HealthController
{
    public function __invoke(Request $request): Response
    {
        return Json::success($request, ['status' => 'alive']);
    }
}
