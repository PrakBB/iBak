<?php
/** @var \App\Model\Product[] $products */
/** @var \App\Service\Router $router */

$title = 'Product List';
$bodyClass = 'index';

ob_start(); ?>
    <h1>Product List</h1>

    <a href="<?= $router->generatePath('product-create') ?>">Create new</a>

    <ul class="index-list">
        <?php foreach ($products as $product): ?>
            <li>
                <h3><?= $product->getName() ?> (<?= $product->getPrice() ?> PLN)</h3>
                <ul class="action-list">
                    <li><a href="<?= $router->generatePath('product-show', ['id' => $product->getId()]) ?>">Details</a></li>
                    <li><a href="<?= $router->generatePath('product-edit', ['id' => $product->getId()]) ?>">Edit</a></li>
                </ul>
            </li>
        <?php endforeach; ?>
    </ul>

<?php $main = ob_get_clean();
include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';