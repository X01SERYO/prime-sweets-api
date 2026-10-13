# Business and application flows (current)

**Sources:** HTTP routers, product/brand use cases, Alegra sync use case, TypeORM repositories.

Only flows that exist in code are described as current. Version 1 store-to-store flows from the PDR/SPEC are listed as **pending**; they are not filled in.

HTTP mapping for all current flows: success 200 (POST create 201), `NotFoundError` → 404, other `DomainError` → 400, untyped errors → 500. No authentication.

## 1. Brand CRUD

### Create brand — `POST /brands`

Body: `name`, `code`.

1. `Brand.create` trims name and code; empty values fail (`InvalidBrandError`).
2. Reject if another brand has the same name or the same code (`BrandAlreadyExistsError`).
3. Persist `brands`.

### List / get brand — `GET /brands`, `GET /brands/:id`

List returns all brands ordered by name. Get returns one brand or `BrandNotFoundError`.

### Update brand — `PUT /brands/:id`

Body may include `name` and/or `code`. At least one is required.

1. Load brand or `BrandNotFoundError`.
2. Apply `Brand.update` (same trim/empty rules as create).
3. Reject name/code clash with a **different** brand.
4. Persist.

### Delete brand — `DELETE /brands/:id`

1. Load brand or `BrandNotFoundError`.
2. Delete row. If PostgreSQL rejects the delete because products still reference the brand (`ON DELETE RESTRICT`), return `BrandInUseError`.

## 2. Product CRUD

### Create product — `POST /products`

Required: `alegraId` (non-empty trim). Optional: `name`, `brandId`, `suggestedPrice`, `units`, `pack`, `wholesaleCost`, `wholesalePrice`, `retailCost`, `retailPrice`.

1. Reject duplicate `alegraId` (`ProductAlreadyExistsError`).
2. If `brandId` is set, brand must exist (`BrandNotFoundError`).
3. Numeric money fields, when present, must be ≥ 0 (`InvalidProductError`).
4. Persist product and channel prices. **Does not** call Alegra. The code assumes `alegraId` already identifies an Alegra item.

### List / get / search product — `GET /products`, `GET /products/search?q=...`, `GET /products/:id`

- `GET /products`: returns all products ordered by name, with channel prices mapped onto domain fields.
- `GET /products/search?q=...` (or `GET /products?q=...`): server-side search filtering by product name, brand name, brand code, or `alegraId` using SQL ILIKE, ordered by product name.
- `GET /products/:id`: returns one product or `ProductNotFoundError`.

### Update product — `PUT /products/:id`

See flow 3. Updatable fields in this use case: `name`, `wholesalePrice`, `retailPrice` only.

### Delete product — `DELETE /products/:id`

1. Load product or `ProductNotFoundError`.
2. Delete `products` (cascades `product_prices`).
3. **Does not** call Alegra.

## 3. Product update → Alegra item sync

This is the only implemented cross-system business flow.

```text
PUT /products/:id
      |
      v
Load Product
      |
      +-- missing --> ProductNotFoundError
      |
      v
Require at least one of name, wholesalePrice, retailPrice
      |
      v
Validate prices ≥ 0; name, if sent, must not be empty trim
      |
      v
Product.update (name and/or sale prices; costs, brand, alegraId unchanged)
      |
      v
Persist products + product_prices
      |
      v
ProductAlegraSyncService.sync(alegraId, name, wholesalePrice, retailPrice)
      |
      v
SyncProductItemUseCase
      |
      +-- wholesalePrice set --> Alegra price list ALEGRA_PRICE_LIST_MAJOR_ID
      +-- retailPrice set and > 0 --> Alegra price list ALEGRA_PRICE_LIST_MINOR_ID
      |
      v
AlegraClient.updateItem  (PUT {base}/items/{alegraId})
```

Retail price `0` is not added to the Alegra payload. Wholesale price `0` is added if the value is not null/undefined.

If persist succeeds and Alegra then fails, the use case returns failure (`AlegraRequestError` or wrapped error). There is no compensating transaction or outbox.

## 4. Customer CRUD

### Create customer — `POST /customers`

Required: `documentType`, `documentNumber`, `name` (non-empty strings). Optional: `phone`, `email`, `address`.

1. Validate required fields (`InvalidCustomerError`).
2. Reject duplicate document type + number combination (`CustomerAlreadyExistsError`).
3. Persist `customers` with generated UUID.

### List / get / search customer — `GET /customers`, `GET /customers/search?q=...`, `GET /customers/:id`

- `GET /customers`: returns all customers ordered by name.
- `GET /customers/search?q=...` (or `GET /customers?q=...`): server-side search filtering by customer name or document number using SQL ILIKE, ordered by name.
- `GET /customers/:id`: returns one customer or `CustomerNotFoundError`.

### Update customer — `PUT /customers/:id`

Body may include `documentType`, `documentNumber`, `name`, `phone`, `email`, `address`.

1. Load customer or `CustomerNotFoundError`.
2. Reject if updating to a `(documentType, documentNumber)` combination already belonging to a different customer (`CustomerAlreadyExistsError`).
3. Apply `Customer.update` (invariants: non-empty trimmed strings).
4. Persist.

## 5. Sales Day lifecycle

Controls daily operational editability for a seller.

### Open Sales Day — `POST /sales-days/open`

Body: `sellerId` (required), `date` (optional, defaults to current business date in Colombia `America/Bogota`).

1. Validate input format (`validateRequest` with Zod).
2. Check if a Sales Day already exists for that seller and date (`findBySellerAndDate`).
3. If already open, reject with `SalesDayAlreadyOpenError`. If closed, reject with `InvalidSalesDayError`.
4. Create and persist `SalesDay` with status `OPEN` and `openedAt = now()`.

### Get current Sales Day — `GET /sales-days/current?sellerId=...`

Query: `sellerId` (required), `date` (optional, defaults to current business date).

1. Query repository by `sellerId` and target date.
2. If not found, return `SalesDayNotFoundError`.
3. Return Sales Day primitives.

### Close Sales Day — `POST /sales-days/:id/close`

1. Load Sales Day by `id` or `SalesDayNotFoundError`.
2. Apply `SalesDay.close()`. If already closed, reject with `SalesDayAlreadyClosedError`.
3. Set status to `CLOSED`, record `closedAt = now()`, and persist.

### Reopen current Sales Day — `POST /sales-days/:id/reopen`

1. Load Sales Day by `id` or `SalesDayNotFoundError`.
2. Check current business date via `BusinessDateProvider` (`America/Bogota`).
3. If the Sales Day date is historical (different from current business date), reject with `SalesDayCannotBeReopenedError`.
4. If already open, reject with `SalesDayAlreadyOpenError`.
5. Set status back to `OPEN`, clear `closedAt`, and persist.

## 6. Sales and Invoice Numbering lifecycle

Controls draft capture, transaction-time item customization, wholesale price snapshotting, atomic invoice allocation, and logical voiding.

### Create Sale — `POST /sales`

Body: `salesDayId` (required UUID), `customerId` (required UUID), `items` (optional array of `{ productId, itemName?, quantity }`).

1. Validate input payload with Zod.
2. Check that target Sales Day is `OPEN` via `SalesDayStatusChecker`. If closed, reject with `SalesDayNotOpenForSaleError`.
3. Check that Customer exists via `CustomerChecker`. If not found, reject with `CustomerNotFoundForSaleError`.
4. Create `Sale` in `DRAFT` status.
5. If items are provided, snapshot Catalog `wholesalePrice`, `wholesaleCost`, and default name for each product via `ProductSnapshotProvider`.
6. Calculate totals: `totalAmount = sum(quantity * wholesalePrice)`, `totalProfit = sum(totalPrice - (quantity * wholesaleCost))`.
7. Persist and return 201 with created sale.

### Add item to Sale — `POST /sales/:id/items`

Body: `productId` (required), `itemName` (optional custom string), `quantity` (positive int).

1. Load sale or `SaleNotFoundError`.
2. Verify that Sales Day is `OPEN`.
3. Fetch Catalog snapshot for product or `ProductNotFoundForSaleError`.
4. Add item to sale (accumulates quantity if product already exists in sale).
5. Recalculate totals and persist.

### Update item quantity — `PUT /sales/:id/items/:productId/quantity`

Body: `quantity` (positive int).

1. Load sale or `SaleNotFoundError`.
2. Verify that Sales Day is `OPEN`.
3. Update item quantity and recalculate totals.
4. Persist.

### Update item name — `PUT /sales/:id/items/:productId/name`

Body: `itemName` (non-empty string).

1. Load sale or `SaleNotFoundError`.
2. Verify that Sales Day is `OPEN`.
3. Verify sale is in `DRAFT` status (item name cannot be modified after confirmation as per PDR).
4. Persist updated transaction-time item name.

### Remove item — `DELETE /sales/:id/items/:productId`

1. Load sale or `SaleNotFoundError`.
2. Verify that Sales Day is `OPEN`.
3. Remove item. If sale is already confirmed, it cannot be left with 0 items (`SaleMustContainItemsError`).
4. Recalculate totals and persist.

### Confirm Sale — `POST /sales/:id/confirm`

1. Load sale or `SaleNotFoundError`.
2. Verify that Sales Day is `OPEN`.
3. Verify that sale is in `DRAFT` status and contains at least 1 item.
4. Allocate next consecutive invoice number atomically via `InvoiceNumberAllocator` (`INV-00001`, `INV-00002`, ...).
5. Transition sale to `CONFIRMED`, set `confirmedAt = now()`, lock invoice number.
6. Persist atomically and return confirmed sale.

### Void Sale — `POST /sales/:id/void`

1. Load sale or `SaleNotFoundError`.
2. Verify that Sales Day is `OPEN`.
3. Verify that sale is `CONFIRMED`.
4. Transition sale to `VOIDED`, record `voidedAt = now()`. The allocated `invoiceNumber` is preserved and never reused.
5. Persist and return voided sale.

### Get / List Sales — `GET /sales/:id`, `GET /sales?salesDayId=...&customerId=...&status=...`

1. Retrieve sale by ID or list sales filtering by Sales Day, Customer, or Status.

## Pending definition / not implemented

These appear in the PDR/SPEC as Version 1. They have **no** code paths in this repository. Details belong in the SPEC when implemented; they are not specified here.

| Area | What is missing in code |
|---|---|
| Authentication | `AuthenticateSeller`, `LogoutSeller`, session rules (OQ-05) |
| Load Sheet | Generate after closed Sales Day; aggregate by `productId` excluding voided sales |
| Invoice document | Generate / list / print / reprint; printer model and mechanism (OQ-03, OQ-04) |
| Catalog Excel migration | One-shot import with invalid/duplicate reporting |
| Alegra inbound | Pull items/prices from Alegra into local catalog |
| Product create/delete sync | Create and delete do not update Alegra |

Open questions remain in the PDR OQ register. This document does not resolve them.
