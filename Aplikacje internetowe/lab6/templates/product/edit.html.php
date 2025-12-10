<?php

/** @var \App\Model\Product $product */
/** @var \App\Service\Router $router */

$title = "Edit Product {$product->getName()} ({$product->getId()})";
$bodyClass = "edit";

ob_start(); ?>
    <h1><?= $title ?></h1>
    <form action="<?= $router->generatePath('product-edit') ?>" method="post" class="edit-form">
        <?php require __DIR__ . DIRECTORY_SEPARATOR . '_form.html.php'; ?>
        <input type="hidden" name="action" value="product-edit">
        <input type="hidden" name="id" value="<?= $product->getId() ?>">

        <input type="submit" value="Update">
    </form>

    <ul class="action-list">
        <li>
            <a href="<?= $router->generatePath('product-index') ?>">Back to list</a>
        </li>
        <li>
            <form action="<?= $router->generatePath('product-delete') ?>" method="post">
                <input type="submit" value="Delete" onclick="return confirm('Are you sure?')">
                <input type="hidden" name="action" value="product-delete">
                <input type="hidden" name="id" value="<?= $product->getId() ?>">
            </form>
        </li>
    </ul>

<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';