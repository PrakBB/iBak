<?php
namespace App\Model;

use App\Service\Config;

class Product
{
    private ?int $id = null;
    private ?string $name = null;
    private ?float $price = null;
    private ?string $description = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): self
    {
        $this->id = $id;
        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getPrice(): ?float
    {
        return $this->price;
    }

    public function setPrice(?float $price): self
    {
        $this->price = $price;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public static function fromArray($array): self
    {
        $product = new self();
        $product->fill($array);
        return $product;
    }

    public function fill($array): self
    {
        if (isset($array['id']) && !$this->getId()) {
            $this->setId($array['id']);
        }
        if (isset($array['name'])) {
            $this->setName($array['name']);
        }
        if (isset($array['price'])) {
            $this->setPrice((float)$array['price']);
        }
        if (isset($array['description'])) {
            $this->setDescription($array['description']);
        }
        return $this;
    }

    public static function findAll(): array
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = 'SELECT * FROM product';
        $statement = $pdo->prepare($sql);
        $statement->execute();

        $products = [];
        $productsArray = $statement->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($productsArray as $item) {
            $products[] = self::fromArray($item);
        }
        return $products;
    }

    public static function find($id): ?self
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = 'SELECT * FROM product WHERE id = :id';
        $statement = $pdo->prepare($sql);
        $statement->execute(['id' => $id]);

        $itemArray = $statement->fetch(\PDO::FETCH_ASSOC);
        if (!$itemArray) {
            return null;
        }
        return self::fromArray($itemArray);
    }

    public function save(): void
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        if (!$this->getId()) {
            $sql = "INSERT INTO product (name, price, description) VALUES (:name, :price, :description)";
            $statement = $pdo->prepare($sql);
            $statement->execute([
                'name' => $this->getName(),
                'price' => $this->getPrice(),
                'description' => $this->getDescription(),
            ]);
            $this->setId($pdo->lastInsertId());
        } else {
            $sql = "UPDATE product SET name = :name, price = :price, description = :description WHERE id = :id";
            $statement = $pdo->prepare($sql);
            $statement->execute([
                ':name' => $this->getName(),
                ':price' => $this->getPrice(),
                ':description' => $this->getDescription(),
                ':id' => $this->getId(),
            ]);
        }
    }

    public function delete(): void
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = "DELETE FROM product WHERE id = :id";
        $statement = $pdo->prepare($sql);
        $statement->execute([':id' => $this->getId()]);

        $this->setId(null);
    }
}