<?php

declare(strict_types=1);

namespace VelvetVogue\Core\Routing;

use Psr\Container\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Exception\MethodNotAllowedException;
use Symfony\Component\Routing\Exception\ResourceNotFoundException;
use Symfony\Component\Routing\Matcher\UrlMatcher;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouteCollection;
use VelvetVogue\Core\Exceptions\HttpException;

final class Router
{
    private RouteCollection $routes;

    public function __construct(private ContainerInterface $container)
    {
        $this->routes = new RouteCollection();
    }

    public function add(string $name, string $path, array $methods, string $controller, array $middleware = []): void
    {
        $this->routes->add($name, new Route($path, ['_controller' => $controller, '_middleware' => $middleware], methods: $methods));
    }

    public function dispatch(Request $request): Response
    {
        $context = (new RequestContext())->fromRequest($request);
        try {
            $attributes = (new UrlMatcher($this->routes, $context))->match($request->getPathInfo());
        } catch (ResourceNotFoundException) {
            throw new HttpException(404, 'not_found', 'Resource not found.');
        } catch (MethodNotAllowedException $error) {
            throw new HttpException(405, 'method_not_allowed', 'Method not allowed.', headers: ['Allow' => implode(', ', $error->getAllowedMethods())]);
        }
        $request->attributes->add($attributes);
        $next = fn (Request $r): Response => ($this->container->get($attributes['_controller']))($r);
        foreach (array_reverse($attributes['_middleware']) as $id) {
            $middleware = $this->container->get($id);
            $downstream = $next;
            $next = fn (Request $r): Response => $middleware->process($r, $downstream);
        }
        return $next($request);
    }
}
