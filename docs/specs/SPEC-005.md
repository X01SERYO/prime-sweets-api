# SPEC-005 — Supplier purchase orders

**Status:** Proposed
**Language:** English
**Architecture:** Modular monolith per [ADR-001](../adrs/ADR-001.md); new context per [ADR-005](../adrs/ADR-005.md)
**Document role:** Implementation guide for [PDR-005](../pdrs/PDR-005.md). Not a description of the current codebase.

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| `sales`, `retail-sales`, `fulfillment-output`, `customers` | Yes | None. |
| `GET /products/search` | Yes | Reused by the UI to pick supplier products. No new search route. |
| Catalog cost | Yes, `product_prices.cost` for the wholesale channel | Read through a new ACL. Not updated by this context. |
| New context `purchasing` | No | Create. |
| Migration | No | `suppliers`, `supplier_products`, `purchase_orders`. |

## 1. Domain

### `Supplier`

| Field | Notes |
|---|---|
| `id` | From `IdGenerator`. |
| `name` | Trimmed, 1–120 characters. |
| `products` | Links: `productId`, and the last-order hint `lastQuantity`, `lastUnitCost`, `lastItemName` (nullable). |

- `rename(name)`.
- `linkProduct(productId)` — no-op if already linked. Does not clear last-order hints.
- `unlinkProduct(productId)` — drops the link and its hints. Does not edit saved orders.
- `applySavedLines(lines)` — for each linked product, set the hint from the saved lines of that product, or clear `lastQuantity` / `lastUnitCost` / `lastItemName` when the product was not on this order. Quantity is the sum. `lastItemName` is set only when every line of that product has the same name.

### `PurchaseOrder`

| Field | Notes |
|---|---|
| `id` | From `IdGenerator`. |
| `supplierId` | Required. |
| `lines` | Present only while this is the latest order for the supplier. |
| `lineCount`, `totalCost` | Derived at create and kept after lines are dropped. |

`PurchaseOrder.create(id, supplierId, lines)`:

- At least one line.
- Each line: `productId` linked to the supplier, integer `quantity` ≥ 1, `unitCost` > 0, `catalogName`, and `itemName`.
- Names follow shared `itemNames`: the catalog name is stored in uppercase, and an extra is kept only when `itemName` starts with that catalog name. The same product with the same `itemName` adds quantities. A different extra is another line.
- `lineCost` = round(`unitCost × quantity`, 2). `totalCost` = sum of line costs.

`dropLines()` — clears lines, keeps `lineCount` and `totalCost`.

### Line fields (value object)

`productId`, `productCode`, `brandName`, `catalogName`, `itemName`, `unitCost`, `quantity`.

Snapshots of code, brand, and name come from the catalog at save time.

### Errors (stable codes)

`SUPPLIER_NOT_FOUND`, `SUPPLIER_NAME_INVALID`, `PRODUCT_NOT_LINKED`, `PRODUCT_WITHOUT_COST`, `PURCHASE_ORDER_EMPTY`, `INVALID_PURCHASE_QUANTITY`, `PURCHASE_LINE_NAME_INVALID`.

## 2. Persistence

```
suppliers
  id            uuid PK
  name          varchar(120) NOT NULL
  created_at / updated_at timestamptz

supplier_products
  supplier_id     uuid FK suppliers ON DELETE CASCADE
  product_id      uuid NOT NULL
  last_quantity   int NULL
  last_unit_cost  numeric(12,2) NULL
  last_item_name  varchar(255) NULL
  PRIMARY KEY (supplier_id, product_id)

purchase_orders
  id            uuid PK
  supplier_id   uuid FK suppliers
  line_count    int NOT NULL
  total_cost    numeric(14,2) NOT NULL
  lines         jsonb NULL
  created_at    timestamptz NOT NULL
  INDEX (supplier_id, created_at DESC)
  PARTIAL INDEX (supplier_id) WHERE lines IS NOT NULL
```

`lines` is an array of `{ productId, productCode, brandName, catalogName, itemName, unitCost, quantity }`. Line cost is not stored.

`product_id` is not a foreign key, matching other snapshots that must survive catalog changes. The use case checks the product through the ACL before save.

### 2.1 Save transaction

1. Load the supplier and its links.
2. Resolve each requested line through `PurchaseProductReader` (code, brand, name, wholesale cost). Missing cost → `PRODUCT_WITHOUT_COST`. Product not linked → `PRODUCT_NOT_LINKED`.
3. Build the order.
4. `UPDATE purchase_orders SET lines = NULL WHERE supplier_id = :id AND lines IS NOT NULL`.
5. Insert the new order with lines.
6. `applySavedLines` and update `supplier_products` hints in the same transaction.

No cron. At most one order per supplier has `lines` after each save.

## 3. HTTP

Bearer session on every route.

| Method and path | Use case | Behavior |
|---|---|---|
| `GET /suppliers` | `ListSuppliers` | `{ items: [{ id, name, productCount }] }` sorted by name. |
| `POST /suppliers` | `CreateSupplier` | Body `{ name }`. Returns the supplier. |
| `PATCH /suppliers/:id` | `RenameSupplier` | Body `{ name }`. |
| `GET /suppliers/:id` | `GetSupplier` | Supplier plus links. Each link includes catalog code, brand, name, current unit cost, and `lastQuantity` / `lastItemName` (null when never ordered). This is the new-order sheet. It does not read `purchase_orders.lines`. |
| `PUT /suppliers/:id/products` | `SetSupplierProducts` | Body `{ productIds: uuid[] }`. Replaces the link set. Keeps hints for ids that remain. Unknown product → 404 from the catalog ACL. |
| `POST /purchase-orders` | `CreatePurchaseOrder` | Body `{ supplierId, lines: [{ productId, quantity, itemName? }] }`. A missing `itemName` uses the catalog name. Returns the created order with lines and `totalCost`. |
| `GET /purchase-orders?supplierId=&page=&pageSize=` | `ListPurchaseOrders` | Headers only, newest first. `page` from 1, `pageSize` default 10, max 50. Item: `id`, `supplierId`, `supplierName`, `createdAt`, `lineCount`, `totalCost`, `hasLines`. |
| `GET /purchase-orders/:id` | `GetPurchaseOrder` | Header plus `lines`. `lines` is `[]` when this order is no longer the latest (`hasLines: false`). |

`unitCost` on the create body is ignored. The server snapshots catalog cost.

## 4. Context layout

```
src/contexts/purchasing/
  domain/entities/supplier.ts, purchaseOrder.ts
  domain/errors/*
  application/ports/outbound/supplier.repository.ts
  application/ports/outbound/purchaseOrder.repository.ts
  application/ports/outbound/purchaseProductReader.port.ts
  application/use-cases/{listSuppliers,createSupplier,renameSupplier,getSupplier,setSupplierProducts,createPurchaseOrder,listPurchaseOrders,getPurchaseOrder}/
  adapters/inbound/http/purchasing.route.ts, purchasing.schema.ts
  adapters/outbound/persistence/
src/apps/dependency-injection/acl/catalogPurchaseProductReader.ts
```

Register entities on `TypeOrmDataSource` and the route in `src/apps/api/routes`.

## 5. Tests

- Creating a supplier and linking two products; `GET /suppliers/:id` returns both with null last quantity.
- Replacing links drops the removed product and keeps the hint of a product that stays.
- Saving an order snapshots cost, code, brand, and name; total is the sum of rounded lines.
- A second order for the same supplier: the first `GET` returns `lines: []` and the same `totalCost`; the sheet shows the first order's quantities as `lastQuantity`.
- A product omitted on the second order has `lastQuantity: null` on the sheet.
- Quantity `0`, negative, duplicate product, empty lines, unknown supplier, unlinked product, and missing cost are rejected.
- `itemName` "Chocolatina fresa" with catalog name "Chocolatina" is stored as catalog `CHOCOLATINA` and item `CHOCOLATINA fresa`. The same product and name on two input lines becomes one line with the quantities added.
- A catalog cost change after save does not change the saved line.
- Sales, retail, and load-sheet tests still pass.

## 6. Definition of done

- UI screens specified in the UI [SPEC-006](../../../prime-sweets-ui/docs/specs/SPEC-006.md).
- `architecture/`, `data-model/`, and `flows/` updated only after the code lands.
