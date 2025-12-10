<?php
/** @var \App\Model\Product $product */
/** @var \App\Service\Router $router */
$title = 'Create Product';
$bodyClass = "edit";
ob_start(); ?>
    <h1>Create Product</h1>
    <form action="<?= $router->generatePath('product-create') ?>" method="post" class="edit-form">
        <?php require __DIR__ . DIRECTORY_SEPARATOR . '_form.html.php'; ?>
        <input type="hidden" name="action" value="product-create">

        <input type="submit" value="Create">
    </form>

    <a href="<?= $router->generatePath('product-index') ?>">Back to list</a>
<?php $main = ob_get_clean();
include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';