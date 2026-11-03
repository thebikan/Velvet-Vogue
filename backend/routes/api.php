<?php

declare(strict_types=1);

use VelvetVogue\Core\Routing\Router;
use VelvetVogue\Core\Http\HealthController;
use VelvetVogue\Core\Http\ReadyController;

return static function (Router $router): void {
    $router->add('health', '/api/v1/health', ['GET', 'HEAD'], HealthController::class);
    $router->add('ready', '/api/v1/ready', ['GET', 'HEAD'], ReadyController::class);
};
