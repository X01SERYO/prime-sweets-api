# SPEC-002 — Current week, delivery date, and catalog backlog

**Status:** Proposed
**Language:** English
**Architecture:** Same modular monolith as [ADR-001](../adrs/ADR-001.md) and [ADR-002](../adrs/ADR-002.md)
**Document role:** Implementation guide for [PDR-002](../pdrs/PDR-002.md). Not a description of the current codebase.
**Current implementation:** Version 1 sales, the rolling 7-day list, and Load Sheet by `salesDayId` stay until this spec is built. Do not copy this file into `architecture/`, `data-model/`, or `flows/` until the code lands.

Business formulas, invoice numbering, and customer identity remain [SPEC.md](./SPEC.md). Where this file disagrees with SPEC.md on editability or the Load Sheet input, this file wins.

## 1. Week window

The business timezone already used by Sales Day defines "today".

```text
weekStart = Monday of today's business date
weekEnd   = that Sunday
```

`ListCurrentWeekSalesDays` returns the seller's Sales Days with `date` from `weekStart` through `min(today, weekEnd)`, newest first. Future days of the week are absent until that date is current. Days before Monday are absent.

`recentSalesDayStart` and the rolling limit of 7 are removed from the application path. The HTTP route that listed the last 7 days calls the week query.

A Sales Day is inside the edit window when `weekStart <= salesDay.date <= today`. The day must also be `OPEN`. A closed day rejects sale commands with `SALES_DAY_NOT_OPEN` until it is reopened.

## 2. Sale changes

### Delivery date

`Sale` stores `deliveryDate` (`YYYY-MM-DD`).

`CreateSale` requires `customerId`, `salesDayId`, and `deliveryDate`. The use case rejects a missing date, a date before the Sales Day date, and a Sales Day outside the edit window.

The seller sets the date before the first item. `AddSaleItem` on a sale that has no `deliveryDate` fails. Existing rows backfilled by a migration use the Sales Day date so current sales keep a value.

### Commands inside the window

These commands succeed for a sale whose Sales Day is `OPEN` and inside the edit window:

- `AddSaleItem`
- `UpdateSaleItemQuantity`
- `RemoveSaleItem`
- `UpdateSaleItemName` — still only when status is `DRAFT`
- `ConfirmSale` — still only from `DRAFT`, and it still allocates the capture-date invoice number
- `VoidSale` — from `DRAFT` or `CONFIRMED`
- `SetSaleDeliveryDate` — date must be on or after the Sales Day date

The same commands fail for a Sales Day before `weekStart`. Error code: `SALE_OUTSIDE_EDIT_WINDOW` (400).

Removing the last item of a `CONFIRMED` sale is rejected with `SALE_MUST_CONTAIN_ITEMS`. The seller voids the sale instead. Void keeps the invoice number and excludes the sale from the Load Sheet and from printing.

A confirmed sale that is edited keeps `invoiceNumber`. Totals and profit are recalculated from the stored unit price and cost. Catalog price changes do not rewrite the snapshot.

### Persistence

Add `delivery_date` (`date`, not null) on `sales`. Index `(delivery_date, status)` for the Load Sheet query. Invoice allocation stays on the capture date.

## 3. Load Sheet

`GET /load-sheets?deliveryDate=YYYY-MM-DD` replaces `GET /load-sheets/:salesDayId` as the application entry.

1. Reject a missing or invalid date (400).
2. Read items from sales with that `deliveryDate` and status `CONFIRMED`.
3. Group by `productId` with the same sums, catalog name, brand, and mixed-price rule as the Load Sheet flow.
4. Do not read Sales Day status. Do not group by `itemName`.

An unknown product still fails the sheet. A date with no confirmed sales returns `lines: []`.

## 4. HTTP

| Method | Path | Change |
|---|---|---|
| `GET` | `/sales-days/current-week` | Replaces the rolling 7-day list. |
| `POST` | `/sales` | Body adds required `deliveryDate`. |
| `PATCH` | `/sales/:id/delivery-date` | Body `{ deliveryDate }`. |
| `GET` | `/load-sheets?deliveryDate=` | Replaces `/load-sheets/:salesDayId`. |
| `GET` | `/sales?deliveryDate=` | Confirmed and voided sales with that delivery date. Drafts of the current week stay on the Sales Day list. |

Sale item, confirm, and void routes keep their paths. Their use cases apply the week guard.

Stable codes to add:

| Code | When |
|---|---|
| `SALE_OUTSIDE_EDIT_WINDOW` | Sale command for a day before the current week |
| `DELIVERY_DATE_REQUIRED` | Create or add-item without a delivery date |
| `DELIVERY_DATE_BEFORE_SALE` | Delivery date is before the Sales Day date |

## 5. Catalog backlog

Implement in `catalog` and `alegra`. Do not import those adapters from `sales`.

### Excel migration

A one-shot script reads the current product workbook. Columns are the set in SPEC.md § 18. Each invalid row and each duplicate Alegra id or product code is written to a report. The script does not skip them silently and does not invent prices. A valid row creates the brand when missing and upserts the product and its wholesale and retail prices.

### Alegra inbound

A use case pulls items and prices from Alegra through the existing outbound port and upserts the local catalog. A row Alegra no longer returns is left in place. This feature does not delete local products because an inbound payload omitted them.

### Create and delete

`CreateProduct` and `DeleteProduct` call the Alegra port after the local write commits. An Alegra failure is logged and does not roll back the local write, matching the current update behavior. Retry stays out of this spec.

## 6. Tests

- Week bounds: a Monday does not include the previous Sunday. A Sunday includes that Monday.
- Edit a confirmed sale on an earlier day of this week. Reject the same edit for last week.
- Create without `deliveryDate` fails. Create with a date before the Sales Day fails.
- Load Sheet for Wednesday includes a Monday sale delivered Wednesday and excludes a void and a different delivery date.
- Two item names for one `productId` remain one Load Sheet row.
- Void keeps the invoice number. A later `GenerateInvoice` rejects the void.
- Excel report contains the invalid and duplicate keys. Create and delete invoke the Alegra port after the local save.

## 7. Definition of done

- Domain and use cases enforce the week window and the delivery date. Controllers do not.
- `delivery_date` is not null after migration.
- The Load Sheet query is by delivery date.
- Architecture, data-model, and flows describe the code that landed, not this spec in advance.
- Excel import, inbound pull, and create/delete sync are covered by the tests in section 6, or explicitly still open in `technical-debt.md`.
