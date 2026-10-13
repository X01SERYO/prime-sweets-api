# C4 Level 4 — Code (current)

**Verified critical flow:** update a product, persist locally, then sync name/prices to Alegra.

**Sources:** `UpdateProductUseCase`, `InProcessProductAlegraSyncService`, `SyncProductItemUseCase`, `AlegraHttpClient`, `TypeOrmProductRepository`.

Other use cases are local brand/product CRUD. See [flows](../flows/README.md).

## Dependencies

```mermaid
classDiagram
  class ProductsRouter {
    PUT /products/:id
  }
  class UpdateProductUseCase {
    +run(dto) Result~ProductPrimitives~
  }
  class Product {
    +id
    +alegraId
    +name
    +wholesalePrice
    +retailPrice
    +update()
    +toPrimitives()
  }
  class ProductRepository {
    <<interface>>
    +findById()
    +save()
  }
  class ProductAlegraSyncService {
    <<interface>>
    +sync()
  }
  class TypeOrmProductRepository {
    +save()
    +upsertChannelPrice()
  }
  class InProcessProductAlegraSyncService {
    +sync()
  }
  class SyncProductItemUseCase {
    +run()
  }
  class AlegraClient {
    <<interface>>
    +updateItem()
  }
  class AlegraHttpClient {
    +updateItem()
  }
  class ProductEntity
  class ProductPriceEntity

  ProductsRouter --> UpdateProductUseCase
  UpdateProductUseCase --> ProductRepository
  UpdateProductUseCase --> ProductAlegraSyncService
  UpdateProductUseCase --> Product
  TypeOrmProductRepository ..|> ProductRepository
  TypeOrmProductRepository --> ProductEntity
  TypeOrmProductRepository --> ProductPriceEntity
  InProcessProductAlegraSyncService ..|> ProductAlegraSyncService
  InProcessProductAlegraSyncService --> SyncProductItemUseCase
  SyncProductItemUseCase --> AlegraClient
  AlegraHttpClient ..|> AlegraClient
```

## Sequence

```mermaid
sequenceDiagram
  actor Client
  participant Router as ProductsRouter
  participant UC as UpdateProductUseCase
  participant Repo as ProductRepository
  participant Domain as Product
  participant Sync as ProductAlegraSyncService
  participant AlegraUC as SyncProductItemUseCase
  participant Http as AlegraHttpClient
  participant DB as PostgreSQL
  participant Alegra as Alegra API

  Client->>Router: PUT /products/:id {name, wholesalePrice, retailPrice}
  Router->>UC: run(dto)
  UC->>Repo: findById(id)
  Repo->>DB: SELECT products + prices
  Repo-->>UC: Product or null
  alt not found
    UC-->>Router: Result.fail(ProductNotFoundError)
  else ok
    UC->>Domain: update(name, prices)
    UC->>Repo: save(updated)
    Repo->>DB: UPSERT products + product_prices
    UC->>Sync: sync(alegraId, name, prices)
    Sync->>AlegraUC: run(...)
    AlegraUC->>Http: updateItem(alegraId, {name, price[]})
    Http->>Alegra: PUT /items/{id}
    alt Alegra OK
      UC-->>Router: Result.ok(primitives)
      Router-->>Client: 200 { success, data }
    else persist or Alegra fail
      UC-->>Router: Result.fail
      Router-->>Client: 400 or 500
    end
  end
```

`UpdateProduct` accepts `name`, `wholesalePrice`, and/or `retailPrice` only. It does not change cost, brand, units, pack, or `alegraId`.

Sales Day transitions, sale confirmation, and invoice-number allocation are implemented and described in [flows](../flows/README.md). Invoice document rendering and printing are not implemented.

## Load Sheet generation

**Sources:** `GenerateLoadSheetUseCase`, `LoadSheet.compose`, `SalesDayClosureAdapter`, `ConfirmedSaleItemsAdapter`, `CatalogProductDisplayAdapter`.

`GET /load-sheets/:salesDayId` calls `GenerateLoadSheetUseCase`. The use case reads a Sales Day closure view, confirmed sale-item contributions, and Catalog display fields through fulfillment outbound ports. It does not import `Sale`, `Product`, or `SalesDay` into the fulfillment domain, and it does not write to Sales tables.

`LoadSheet.compose` groups contributions by `productId`, sums quantity, total price, and profit, and fills brand and name from the Catalog display. The transaction-time `itemName` is dropped in `ConfirmedSaleItemsAdapter` before it reaches the domain.
