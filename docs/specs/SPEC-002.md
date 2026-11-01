# SPEC-002 — Delivery days replace Sales Days

**Status:** Proposed (revised 2026-11-01)
**Language:** English
**Architecture:** Same modular monolith as [ADR-001](../adrs/ADR-001.md) and [ADR-002](../adrs/ADR-002.md)
**Document role:** Implementation guide for [PDR-002](../pdrs/PDR-002.md). Not a description of the current codebase.

Business formulas and customer identity remain [SPEC.md](./SPEC.md). Where this file disagrees with SPEC.md on Sales Days, editability, invoice numbering or listing, or the Load Sheet input, this file wins.

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| `sales.delivery_date` + index | Yes | Keep. |
| Delivery date required before the first line | Yes | Keep. Range check becomes today–Sunday from the business date. |
| `PATCH /sales/:id/delivery-date` | Yes (updates in place) | Keep the path. Draft: in place. Confirmed: void + new confirmed sale (§ 1). |
| `GET /load-sheets?deliveryDate=` | Yes | Keep unchanged. |
| `GET /sales?deliveryDate=` | Yes (confirmed + voided) | Include drafts. |
| Void of a draft | Yes | Keep. |
| Week + `OPEN` guard on every sale command | Yes | Remove. |
| `sales-day` context, `/sales-days/*` routes | Version 1 + draft | Delete. |
| `GET /invoices?salesDayId=` | Version 1 | Replace with `deliveryDate`. |
| Invoice sequence keyed by confirmation date | Version 1 | Key by delivery date. |
| Invoice "Fecha de vencimiento" | Version 1 | Becomes "Fecha de entrega" with the delivery date. |
| Seller via Sales Day | Version 1 | `sales.seller_id`. |

## 1. Sale

```text
Sale
  id, customerId, sellerId, captureDate, deliveryDate,
  status DRAFT | CONFIRMED | VOIDED,
  invoiceNumber?, invoiceBusinessDate?, items[], createdAt, confirmedAt?, voidedAt?
```

- `sellerId` comes from the session, never from the body.
- `captureDate` is today's business date at creation. Informational.
- There is no edit window. Status rules alone decide what is allowed.

### Allowed delivery dates

`today <= deliveryDate <= sundayOf(today)` in the business timezone. Same rule on create and on change. Otherwise `DELIVERY_DATE_OUT_OF_RANGE` (400).

### Commands

- `CreateSale` — `customerId`, `deliveryDate`.
- `AddSaleItem`, `UpdateSaleItemQuantity`, `RemoveSaleItem` — `DRAFT` or `CONFIRMED`.
- `UpdateSaleItemName` — `DRAFT` only.
- `ConfirmSale` — `DRAFT` only; allocates the number for `deliveryDate`.
- `VoidSale` — `DRAFT` or `CONFIRMED`.
- `SetSaleDeliveryDate` — see below.

### Changing the delivery date

`SetSaleDeliveryDate { saleId, deliveryDate }`, range rule above. Same date is a no-op.

| Status | Effect | Response |
|---|---|---|
| `DRAFT` | `deliveryDate` is updated. | The same sale. |
| `CONFIRMED` | In one transaction: (1) void the original; it keeps its number on the original date. (2) Create a new `Sale` with a new id, same `customerId`, `sellerId`, `captureDate`, and item snapshots (name, code, unit price, unit cost, quantity), and the new `deliveryDate`. (3) Confirm it, allocating the next number for the new date. | The new sale. |
| `VOIDED` | Rejected with `SALE_ALREADY_VOIDED`. | — |

The voided sale and the new sale are not linked. Nothing in the database relates them; the change is transparent to the seller.

Removing the last item of a `CONFIRMED` sale is rejected with `SALE_MUST_CONTAIN_ITEMS`. Line corrections keep `invoiceNumber`; totals are recalculated from the stored snapshot.

## 2. Invoice number

`InvoiceNumberAllocator.allocateNext(deliveryDate)`. The `invoice_sequences` row id is the delivery date. Formatting stays `001`… then plain digits from `1000`.

`invoiceBusinessDate` stays the confirmation business date.

## 3. Invoice document

`InvoiceDocument` adds `deliveryDate`. The thermal template prints:

- invoice date: confirmation date (unchanged);
- **Fecha de entrega**: `deliveryDate`, in the slot that printed "Fecha de vencimiento".

## 4. Queries by delivery date

| Method | Path | Returns |
|---|---|---|
| `GET` | `/sales?deliveryDate=YYYY-MM-DD` | Drafts, confirmed, and voided sales of that date, with customer name, status, invoice number, total. |
| `GET` | `/load-sheets?deliveryDate=YYYY-MM-DD` | Unchanged. Confirmed only. |
| `GET` | `/invoices?deliveryDate=YYYY-MM-DD` | Confirmed and voided sales of that date, by invoice number. |
| `GET` | `/invoices/:saleId` | Adds `deliveryDate`. |

Any past or current date can be queried. An invalid date returns `INVALID_DELIVERY_DATE` (400). No sales returns an empty list.

## 5. HTTP changes

| Method | Path | Change |
|---|---|---|
| `POST` | `/sales` | Body `{ customerId, deliveryDate }`. `salesDayId` rejected by the schema. |
| `GET`/`POST` | `/sales-days/*` | Removed. |
| `GET` | `/invoices?salesDayId=` | Removed. |

Stable codes:

| Code | When |
|---|---|
| `DELIVERY_DATE_REQUIRED` | Create without a delivery date |
| `DELIVERY_DATE_OUT_OF_RANGE` | Date before today or after this week's Sunday |
| `INVALID_DELIVERY_DATE` | Query date is not `YYYY-MM-DD` |

Retired: `SALES_DAY_NOT_OPEN`, `SALE_OUTSIDE_EDIT_WINDOW`, `DELIVERY_DATE_BEFORE_SALE`, and every Sales Day error.

## 6. Persistence

### Data cleanup (direct command, run once, not a migration)

Run before the schema migration, in one transaction:

```sql
BEGIN;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM invoice_sequences;
DELETE FROM sales_days;
COMMIT;
```

Customers, catalog tables, users, and company profile are not touched.

### Schema migration

1. Drop `sales.sales_day_id` and its FK; drop table `sales_days`.
2. Add `sales.seller_id` (`uuid`, not null, FK users) and `sales.capture_date` (`date`, not null).
3. Keep `delivery_date` and index `(delivery_date, status)`.

The migration assumes `sales` is empty. Update the seed so it creates no sales or Sales Days.

## 7. Tests

- Create needs no Sales Day and stores `sellerId`, `captureDate`, `deliveryDate`.
- Delivery date before today or after Sunday is rejected; on Sunday only Sunday is accepted.
- A sale delivered last week can still be edited and voided.
- Two sales confirmed for the same delivery date get `001` and `002`; a sale for the next day gets `001`.
- Wednesday's Load Sheet and invoices include a Monday capture delivered Wednesday and exclude another date.
- The invoice document carries `deliveryDate`.
- Re-dating a draft updates it in place.
- Re-dating a confirmed sale voids it on the old date (number kept) and returns a new confirmed sale on the new date with the same lines and the next number of that date. A failure in any step leaves nothing changed.

Catalog administration is [SPEC-003](./SPEC-003.md).

## 8. Definition of done

- No `sales-day` code remains.
- Domain and use cases enforce the date range and status rules. Controllers do not.
- Load Sheet, invoices, and sales lists are keyed by delivery date.
- Architecture, data-model, and flows describe the code that landed.
