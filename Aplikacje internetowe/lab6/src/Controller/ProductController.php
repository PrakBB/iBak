<?php
namespace App\Controller;

use App\Exception\NotFoundException;
use App\Model\Product;
use App\Service\Router;
use App\Service\Templating;

class ProductController
{
    public function indexAction(Templating $templating, Router $router): ?string
    {
        $products = Product::findAll();
        $html = $templating->render('product/index.html.php', [
            'products' => $products,
            'router' => $router,
        ]);
        return $html;
    }

    public function createAction(?array $requestPost, Templating $templating, Router $router): ?string
    {
        if ($requestPost) {
            $product = Product::fromArray($requestPost);
            $product->save();

            $path = $router->generatePath('product-index');
            $router->redirect($path);
            return null;
        } else {
            $product = new Product();
        }

        $html = $templating->render('product/create.html.php', [
            'product' => $product,
            'router' => $router,
        ]);
        return $html;
    }

    public function editAction(int $productId, ?array $requestPost, Templating $templating, Router $router): ?string
    {
        $product = Product::find($productId);
        if (! $product) {
            throw new NotFoundException("Missing product with id $productId");
        }

        if ($requestPost) {
            $product->fill($requestPost);
            $product->save();

            $path = $router->generatePath('product-index');
            $router->redirect($path);
            return null;
        }

        $html = $templating->render('product/edit.html.php', [
            'product' => $product,
            'router' => $router,
        ]);
        return $html;
    }

    public function showAction(int $productId, Templating $templating, Router $router): ?string
    {
        $product = Product::find($productId);
        if (! $product) {
            throw new NotFoundException("Missing product with id $productId");
        }

        $html = $templating->render('product/show.html.php', [
            'product' => $product,
            'router' => $router,
        ]);
        return $html;
    }

    public function deleteAction(int $productId, Router $router): ?string
    {
        $product = Product::find($productId);
        if (! $product) {
            throw new NotFoundException("Missing product with id $productId");
        }

        $product->delete();
        $path = $router->generatePath('product-index');
        $router->redirect($path);
        return null;
    }
}