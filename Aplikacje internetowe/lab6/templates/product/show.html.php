<?php

/** @var \App\Model\Product $product */
/** @var \App\Service\Router $router */

$title = "{$product->getName()} ({$product->getId()})";
$bodyClass = 'show';

ob_start(); ?>
    <h1><?= $product->getName() ?></h1>
    <article>
        <p>Price: <strong><?= $product->getPrice(); ?> PLN</strong></p>
        <p><?= $product->getDescription();?></p>
    </article>

    <ul class="action-list">
        <li> <a href="<?= $router->generatePath('product-index') ?>">Back to list</a></li>
        <li><a href="<?= $router->generatePath('product-edit', ['id'=> $product->getId()]) ?>">Edit</a></li>
    </ul>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';