<div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" value="<?= $product->getName() ?>">
</div>

<div class="form-group">
    <label for="price">Price</label>
    <input type="text" id="price" name="price" value="<?= $product->getPrice() ?>">
</div>

<div class="form-group">
    <label for="description">Description</label>
    <textarea id="description" name="description"><?= $product->getDescription() ?></textarea>
</div>