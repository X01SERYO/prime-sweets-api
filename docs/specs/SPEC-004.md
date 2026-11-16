# SPEC-004 — Daily retail sale

**Status:** Proposed
**Language:** English
**Architecture:** Modular monolith per [ADR-001](../adrs/ADR-001.md); new context per [ADR-004](../adrs/ADR-004.md)
**Document role:** Implementation guide for [PDR-004](../pdrs/PDR-004.md). Not a description of the current codebase.

Follows the decisions in PDR-004 §6.

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| `sales` context, `sales` / `sale_items` tables | Yes | None. |
| Invoices, Load Sheet (`fulfillment-output`) | Yes | None. They do not read retail data. |
| `GET /products/search` | Yes, excludes retired products (PDR-003) | Reused by the retail picker. Response must expose `retailPrice` and brand name; add them if missing. |
| `BusinessCalendar` port + adapter | Yes, in `sales` | Reuse the same adapter in the new context. Move the port to `shared` if two contexts need it. |
| `product_prices` retail row | Yes | Read only, through a new ACL. |
| Home screen | Yes | New Detal section in the UI navigation. See UI SPEC-004. |
| New context `retail-sales` | No | Create. |
| Migration | No | `retail_days` only. No detail table (§2). |

## 1. Domain

### `RetailDay` (aggregate root)

| Field | Notes |
|---|---|
| `id` | From `IdGenerator`. |
| `businessDate` | `YYYY-MM-DD`, `America/Bogota`. Set on create. No setter. |
| `items` | `RetailDayItem[]`. Present only while the day is today. Empty after the day is compacted (§2.1). |
| `totalAmount`, `totalProfit` | Derived from items on every write and persisted. After compaction they are the only record of the day. |
| `status` | `UNREVIEWED` (default) or `REVIEWED`. |
| `reviewedAt`, `reviewedBy` | Null until reviewed. |

Behavior:

- `review(userId, now)` — `RetailDayAlreadyReviewedError` if already `REVIEWED`. No date limit: any past or current day can be reviewed. Sets status, `reviewedAt`, `reviewedBy`, and calls `compact()` (OQ-R11). There is no method back to `UNREVIEWED`.
- Editable = `businessDate === today && status === 'UNREVIEWED'` (OQ-R7). Every write checks this and fails with `RetailDayClosedError`.
- `RetailDay.create(id, today)`.
- `addProduct(snapshot, quantity, today)` — closed-day check; `InvalidRetailQuantityError` unless `quantity` is an integer ≥ 1. If the product is already a row, adds `quantity` to it at the row's frozen price; otherwise adds a new row with the snapshot.
- `setQuantity(productId, quantity, today)` — closed-day check; `InvalidRetailQuantityError` unless integer ≥ 1. Removing is a separate action.
- `removeItem(productId, today)` — closed-day check. If no rows remain, the use case deletes the `retail_days` row (OQ-R8).
- The snapshot provider treats a retail price of `0` like a missing one: `ProductWithoutRetailPriceError`.
- `compact()` — drops `items`, keeps totals. Called when `businessDate < today` and on review.
- Totals and summary fields recalculated after each change.

A row is identified by `productId`; a product appears at most once per day, so no separate item id is needed.

### `RetailDayItem` (value object, not persisted as a row)

| Field | Snapshot at add time (OQ-R2) |
|---|---|
| `productId` | |
| `productCode`, `brandName`, `productName` | Display snapshot. |
| `retailPrice` | Required. `ProductWithoutRetailPriceError` if null. |
| `retailCost` | Nullable. Profit uses `0` margin when null (OQ-R5). |
| `quantity` | Integer ≥ 1. |
| `totalPrice` | `retailPrice × quantity`. |
| `profit` | `(retailPrice − retailCost) × quantity`, or `0` when cost is null. |

Money rounded to 2 decimals per line; totals are sums of rounded lines.

### Errors (stable codes)

`RETAIL_DAY_CLOSED`, `RETAIL_DAY_ALREADY_REVIEWED`, `RETAIL_DAY_NOT_FOUND`, `RETAIL_ITEM_NOT_FOUND`, `INVALID_RETAIL_QUANTITY`, `PRODUCT_WITHOUT_RETAIL_PRICE`, `PRODUCT_NOT_FOUND_FOR_RETAIL`.

## 2. Persistence

One table. No detail table.

```
retail_days
  id                  uuid PK
  business_date       date NOT NULL UNIQUE
  status              varchar(20) NOT NULL default 'UNREVIEWED' CHECK IN ('UNREVIEWED','REVIEWED')
  total_amount        numeric(12,2) NOT NULL default 0
  total_profit        numeric(12,2) NOT NULL default 0
  open_items          jsonb NULL          -- today's draft only
  reviewed_at         timestamptz NULL
  reviewed_by         uuid NULL FK users(id)
  created_at / updated_at timestamptz
  INDEX (status, business_date DESC)
  PARTIAL INDEX (business_date) WHERE open_items IS NOT NULL
```

`open_items` is an array of `{ productId, productCode, brandName, productName, retailPrice, retailCost, quantity }`. Line total and profit are not stored; they are derived. A day has at most a few dozen products, so the document stays a few KB.

`UNIQUE(business_date)` makes "one retail sale per day" hold under concurrent first requests: `INSERT ... ON CONFLICT (business_date) DO NOTHING`, then read.

### 2.1 Daily draft lifecycle (compaction)

| Moment | `open_items` | Summary columns |
|---|---|---|
| First product added today | Created | Recomputed |
| Each add / quantity / remove today | Rewritten in the same `UPDATE` | Recomputed in the same `UPDATE` |
| Last product removed today | Row deleted | Row deleted. A stored day always has `total_amount > 0`. |
| Day changes (`business_date < today`) | Set to `NULL` | Unchanged, final |
| Review (any day, including today) | Set to `NULL` in the same `UPDATE` | Unchanged; `status`, `reviewed_at`, `reviewed_by` set |

Summary columns are written in the same statement as the draft, so they are always final at any moment; compaction only removes data, it never computes anything. That makes compaction safe to run late, twice, or never.

Compaction is **lazy**, with no cron or scheduler: every retail use case starts with

```sql
UPDATE retail_days SET open_items = NULL
WHERE open_items IS NOT NULL AND business_date < :today
```

The partial index makes this a no-op lookup when there is nothing to compact. In steady state the table holds at most one draft (today's).

Session close or device change: the draft is on the server, so another device or a new session reads it with `GET /retail-days/today`. Nothing is kept only in the browser.

### 2.2 Concurrency

Not handled. Two devices editing the same retail day at the same moment is not a business case; the last write wins. No version column and no retry.

### 2.3 Storage estimate

One row per business day with a sale: about 365 small rows per year once compacted. The detail alternative would add, for example, 40 products × 365 days ≈ 14,600 rows per year that nobody reads after the day ends.

## 3. HTTP

All routes require the bearer session. The server decides "today"; the client never sends the date for a write.

| Method and path | Use case | Behavior |
|---|---|---|
| `GET /retail-days/today` | `GetTodayRetailDay` | Returns today's day. If it does not exist, returns an empty day `{ businessDate, items: [], totals 0, editable: true, reviewedByName: null }` without inserting. When the day is `REVIEWED`, `reviewedByName` is the reviewer's display name, or `null` if that user no longer exists. |
| `GET /retail-days/:date` | `GetRetailDay` | Summary of a stored day. `items` is always `[]`. Includes status, totals, `reviewedAt`, and `reviewedByName`. A past day is `editable: false`. 404 `RETAIL_DAY_NOT_FOUND` if nothing was recorded that day. A future date or a date that is not a real calendar day → 400 `INVALID_RETAIL_DATE`. |
| `GET /retail-days?status=&page=&pageSize=` | `ListRetailDays` | Previous-days views. `status` required: `UNREVIEWED` or `REVIEWED`. Same pagination contract as `GET /products`: `page` from 1, `pageSize` default **10**, max 50; response `{ items, total, page, pageSize }`. Each item: `businessDate`, `status`, `totalAmount`, `totalProfit`, `reviewedAt`, `reviewedByName`. Newest first. Today is included when it exists and is `UNREVIEWED`. No zero-total filter is needed: such days are never stored. |
| `POST /retail-days/review` | `ReviewRetailDays` | Cierre de caja for several days. Body `{ dates: ["YYYY-MM-DD", ...] }`, 1 to 50 distinct dates. One transaction, all or none: 404 `RETAIL_DAY_NOT_FOUND` if any date has no record, 409 `RETAIL_DAY_ALREADY_REVIEWED` (with the offending dates) if any is already reviewed; in both cases nothing changes. Each day gets `REVIEWED`, the same `reviewed_at` and `reviewed_by`, and `open_items = NULL`. Returns `{ reviewed: n, totalAmount, totalProfit }` of the reviewed days. |
| `POST /retail-days/today/items` | `AddRetailItem` | Body `{ productId, quantity }`, `quantity` integer ≥ 1. Creates today's day if needed. If the product is already on the list, the quantity is added to that row. Returns the full day. |
| `PATCH /retail-days/today/items/:productId` | `SetRetailItemQuantity` | Body `{ quantity }`, integer ≥ 1. Returns the full day. |
| `DELETE /retail-days/today/items/:productId` | `RemoveRetailItem` | Returns the full day. |

There is deliberately no route that accepts a date for an item write, no route that updates `business_date`, and no route that sets `UNREVIEWED`. The review route takes dates because reviewing past days is allowed; it only changes the status and discards any remaining detail. Item routes always target today; if today is already reviewed, the use case answers 409 `RETAIL_DAY_CLOSED`. A tab left open across midnight writes to the new, empty day instead of the old one, so the client compares the returned `businessDate` with the one it shows and reloads if they differ.

Pagination is offset-based with `LIMIT/OFFSET` over the `(status, business_date DESC)` index; at about 365 rows per year this is cheap.

Response shape:

```json
{
  "id": "uuid|null",
  "businessDate": "2026-11-14",
  "editable": true,
  "status": "UNREVIEWED",
  "reviewedAt": null,
  "reviewedByName": null,
  "totalAmount": 0,
  "totalProfit": 0,
  "items": [
    { "productId": "uuid", "productCode": "A12", "brandName": "Jet",
      "productName": "Chocolatina", "retailPrice": 1500, "quantity": 0,
      "totalPrice": 0, "profit": 0, "hasCost": true }
  ]
}
```

`retailCost` is not exposed to the client; only per-line and day profit, and `hasCost` so the client can warn when the product had no retail cost.

## 4. Context layout

```
src/contexts/retail-sales/
  domain/entities/retailDay.ts, retailDayItem.ts
  domain/errors/*
  application/ports/outbound/retailDay.repository.ts
  application/ports/outbound/retailProductSnapshotProvider.port.ts
  application/use-cases/{getTodayRetailDay,getRetailDay,listRetailDays,reviewRetailDays,addRetailItem,setRetailItemQuantity,removeRetailItem}/
  adapters/inbound/http/retailDays.route.ts, retailDays.schema.ts
  adapters/outbound/persistence/{retailDay.entity,retailDay.mapper}.ts
  adapters/outbound/persistence/repositories/typeOrmRetailDay.repository.ts
src/apps/dependency-injection/acl/catalogRetailProductSnapshotProvider.ts
```

Register entities in `TypeOrmDataSource` and the route in `src/apps/api/routes`.

## 5. Tests

- First `GET /today` of a day returns an empty editable day and inserts nothing.
- Adding a product with quantity 3 creates the day and a row with quantity 3, retail price snapshot, and the right totals.
- Adding the same product again with quantity 2 keeps one row with quantity 5 at the first frozen price.
- Setting quantity recomputes the line and both totals; profit uses retail cost.
- Quantity `0`, negative, and non-integer values are rejected on add and on set.
- Deleting a row recomputes totals.
- A product without a retail price is rejected. A retired product is not rejected yet: the catalog has no retired mark, so search and add cannot exclude it.
- With the calendar moved to the next day, `GET /today` returns a new empty day, and the previous day has `open_items = NULL` with its totals and status unchanged.
- Compaction run twice changes nothing else.
- Reviewing today sets `open_items = NULL`, keeps totals, and later item writes return `RETAIL_DAY_CLOSED`.
- Another session reading `GET /today` sees the same draft.
- `GET /retail-days/:date` of a past day returns `editable: false` and `items: []`.
- A later catalog price change does not alter existing rows (OQ-R2).
- A new day is `UNREVIEWED`. Review moves it to `REVIEWED` and sets `reviewedAt`/`reviewedBy`. A second review returns `RETAIL_DAY_ALREADY_REVIEWED`.
- A day several days old and still `UNREVIEWED` can be reviewed.
- Reviewing three dates at once marks all three with the same `reviewedAt`/`reviewedBy` and returns their summed totals.
- If one of the selected dates is already reviewed or does not exist, none of them changes.
- Removing the last product of today deletes the `retail_days` row; `GET /today` then returns an empty day and the list does not show it.
- A product with retail price `0` is rejected.
- `ListRetailDays?status=UNREVIEWED` returns only unreviewed days, newest first, 10 per page by default, with the right `total`. A missing or invalid `status` is rejected.
- A product without retail cost is added with `hasCost: false` and profit `0`.
- Wholesale sales, invoices, and Load Sheet tests still pass unchanged.

## 6. Definition of done

- UI screens specified in the UI [SPEC-004](../../../prime-sweets-ui/docs/specs/SPEC-004.md).
- `architecture/`, `data-model/`, and `flows/` updated only for what landed.
- `technical-debt.md` updated if `BusinessCalendar` stays duplicated instead of moved to `shared`.
