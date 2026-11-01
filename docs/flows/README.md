# Business and application flows (current)

**Sources:** HTTP routers, catalog, customer, sales, Load Sheet, invoice list, and invoice generation use cases, `loadAppConfig`, and TypeORM repositories.

Only flows that exist in code are described as current. Version 1 store-to-store flows from the PDR/SPEC are listed as **pending**; they are not filled in.

HTTP mapping for all current flows: success 200 (POST create 201), `NotFoundError` → 404, other `DomainError` → 400, untyped errors → 500. Business routes require a bearer session. A missing or unknown token is `INVALID_SESSION` (401).

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
4. Persist product and channel prices. A non-blank `name` is stored with `toLocaleUpperCase('es-CO')`. **Does not** call Alegra. The code assumes `alegraId` already identifies an Alegra item.

### List / get / search product — `GET /products`, `GET /products/search?q=...`, `GET /products/:id`

- `GET /products`: returns all products ordered by name, with channel prices mapped onto domain fields.
- `GET /products/search?q=...` (or `GET /products?q=...`): server-side search filtering by product name, brand name, brand code, or `alegraId` using SQL ILIKE, ordered by product name.
- `GET /products/:id`: returns one product or `ProductNotFoundError`.

### Update product — `PUT /products/:id`

See flow 3. Updatable fields in this use case: `name`, `wholesalePrice`, `retailPrice` only. A new `name` is stored in uppercase (`es-CO`).

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

If persist succeeds and Alegra then fails, the failure is logged and the use case still returns the saved product. There is no compensating transaction or outbox.

## 4. Customer CRUD

### Create customer — `POST /customers`

Required: `documentType`, `documentNumber`, `name` (non-empty strings). Optional: `phone`, `email`, `address`.

1. Validate required fields (`InvalidCustomerError`).
2. Reject duplicate document type + number combination (`CustomerAlreadyExistsError`). Document type is compared without case. The document number is exact.
3. Persist `customers` with generated UUID. `name` is stored with `toLocaleUpperCase('es-CO')`. A concurrent insert that hits `UQ_customers_document` is returned as the same `CustomerAlreadyExistsError`.

### List / get / search customer — `GET /customers`, `GET /customers/search?q=...`, `GET /customers/:id`

- `GET /customers`: returns all customers ordered by name.
- `GET /customers/search?q=...` (or `GET /customers?q=...`): server-side search filtering by customer name or document number using SQL ILIKE, ordered by name.
- `GET /customers/:id`: returns one customer or `CustomerNotFoundError`.

### Update customer — `PUT /customers/:id`

Body may include `documentType`, `documentNumber`, `name`, `phone`, `email`, `address`.

1. Load customer or `CustomerNotFoundError`.
2. Reject if updating to a `(documentType, documentNumber)` combination already belonging to a different customer (`CustomerAlreadyExistsError`). A concurrent update that hits `UQ_customers_document` returns the same error.
3. Apply `Customer.update` (invariants: non-empty trimmed strings). A new `name` is stored in uppercase (`es-CO`).
4. Persist.

## 5. Delivery day

There is no Sales Day. A sale stores `sellerId` (the session user), `captureDate` (the business day it was taken), and `deliveryDate`. Allowed delivery dates are today through Sunday of the current week in `America/Bogota`. A day never locks. A draft cannot be voided. A confirmed sale can be edited or voided on any week.

### Change delivery date — `PATCH /sales/:id/delivery-date`

1. Same date is a no-op.
2. A `DRAFT` updates `deliveryDate` in place.
3. A `CONFIRMED` sale is voided and keeps its invoice number. A new confirmed sale is saved in the same transaction with a new id, the same customer, seller, capture date, and item snapshots, the new delivery date, and the next invoice number for that date. The two rows are not linked.
4. A `VOIDED` sale is rejected.

## 6. Sales and invoice numbering

### Create sale — `POST /sales`

Body: `customerId`, `deliveryDate`. `sellerId` comes from the session, not the body.

1. Reject a delivery date before today or after Sunday (`DELIVERY_DATE_OUT_OF_RANGE`).
2. Reject an unknown customer.
3. Persist a `DRAFT` with `captureDate` equal to today.

### Add, update, and remove items

Item commands do not check a day status. Quantity is a positive number with at most 3 decimal places. `itemName` can change only while the sale is `DRAFT`. A confirmed sale cannot be left with zero items. The same product with the same item name accumulates quantity. A different name stays a separate line.

### Confirm — `POST /sales/:id/confirm`

1. The sale must be a `DRAFT` with at least one item.
2. `allocateNext(deliveryDate)` takes the next number for that delivery date (`001`, `002`, …).
3. `invoiceBusinessDate` is today (the confirmation date). `saleDate` on the invoice document is `confirmedAt`. `deliveryDate` is stored separately.

### Void — `POST /sales/:id/void`

Only a `CONFIRMED` sale can be voided. The invoice number stays. A `DRAFT` is rejected with `SALE_CANNOT_BE_MODIFIED`.

### List — `GET /sales?deliveryDate=&customerId=&status=`

Returns drafts, confirmed sales, and voided sales for that delivery date. Ordered by `createdAt` descending.

## 7. Load Sheet — `GET /load-sheets?deliveryDate=`

Built in memory from `CONFIRMED` items whose sale delivery date matches. Drafts and voided sales contribute nothing. Grouping, catalog names, and price groups are unchanged. The day does not need to be closed.

## 8. Invoice list — `GET /invoices?deliveryDate=`

Returns `CONFIRMED` and `VOIDED` sales that already have an invoice number for that delivery date. Drafts are omitted. `salesDayId` is not a query parameter.

## 9. Invoice document — `GET /invoices/:saleId`

1. A missing sale is `SALE_NOT_FOUND`.
2. `CONFIRMED` and `VOIDED` sales are accepted. A `DRAFT` is `SALE_NOT_INVOICEABLE`.
3. A voided document sets `voided: true`. The UI draws a diagonal "ANULADA" mark and does not print it.
4. `saleDate` is `confirmedAt`. `deliveryDate` is the sale delivery date. The printed label is "Fecha de entrega".
5. The API does not print. The UI prints confirmed documents through one browser dialog, 70 mm, no margin, page break between invoices. It does not record a printed mark.

## Pending definition / not implemented

Authentication is built: `POST /auth/login`, `GET /auth/session`, and `POST /auth/logout`. Sessions are stored in Postgres and survive a process restart until they expire. A seller keeps at most 3 open sessions; a new login closes the oldest. Business routes reject a missing or unknown token with `INVALID_SESSION`.

These remaining areas appear in the PDR/SPEC and have **no** code paths here.

| Area | What is missing in code |
|---|---|
| Invoice printing in the API | No API print route. The UI prints through the Windows dialog using the invoice document. Resolved in PDR OQ-03 and OQ-04. |
| Catalog Excel migration and Alegra inbound product sync | Specified in [PDR-002](../pdrs/PDR-002.md). No code paths in this repository yet. |

Open questions remain in the PDR OQ register. This document does not resolve them.
