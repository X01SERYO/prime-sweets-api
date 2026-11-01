# SPEC-003 — Product administration and Alegra

**Status:** Proposed
**Language:** English
**Architecture:** Same modular monolith as [ADR-001](../adrs/ADR-001.md) and [ADR-003](../adrs/ADR-003.md)
**Document role:** Implementation guide for [PDR-003](../pdrs/PDR-003.md). Not a description of the current codebase.

## 0. Impact on what is already built

| Area | Built | Change |
|---|---|---|
| `PUT /products/:id` | Yes, body is `name`, `wholesalePrice`, `retailPrice` | Also accept the existing cost, units, and pack fields. Omitted means unchanged. `0` is a value. Costs are not sent to Alegra. |
| Alegra sync after update | Yes | Today it sends the stored name and drops a retail price of `0`. Change it so one `PUT` carries only the sale prices that changed, including `0`. |
| `CreateProduct` | Yes, local only | Stay local. No Alegra create in this feature. |
| `DeleteProduct` | Physical delete, no Alegra call | Replace with a logical delete. Do not call Alegra. |
| Sale product search | Yes | Exclude logically deleted products. |
| Listing items from Alegra | No | Out of scope. The web does not pull the catalog from Alegra. |

Do not import catalog or Alegra adapters from `sales`.

## 1. Logical delete

A retired product stays in `products`. It is marked so sale search omits it. Rows already snapshotted on a sale are not rewritten. Deleting a product does not delete `product_prices` by cascade anymore, because the row stays.

## 2. PUT /products/:id

The path stays `PUT /products/:id`. No new resource. The body uses fields the product and `product_prices` already store. `wholesale` and `retail` are separate rows (`channel`), so a wholesale value never writes the retail row.

| Field | Omitted | Empty, `null`, or blank | `0` | Negative |
|---|---|---|---|---|
| `name` | Keep stored name | Reject | Not a number | Reject an empty string |
| `wholesaleCost`, `retailCost` | Keep stored cost | Reject | Store `0`. Do not notify Alegra. | Reject |
| `wholesalePrice`, `retailPrice` | Keep stored price | Reject | Store `0` and notify Alegra | Reject |
| `units`, `pack` | Keep stored integer | Reject | Store `0`. Do not notify Alegra. | Reject |

Every editable value on the product screen is persisted. An update does not accept an empty field: omit it to leave it unchanged, or send a real value. `0` is a real value. `null` and `""` are rejected for every field in this body.

Presence is `!== undefined`. Do not use truthiness.

`brandId` is not in this update. `suggestedPrice` stays the stored column and is not recomputed. The 15% figure is a client display, specified in the UI SPEC.

## 3. Alegra

The web is where the seller changes a product. The API stores the change and then notifies Alegra with **only what changed**. Listing items from Alegra is not part of this feature.

Credentials and price-list ids come from the environment, never from source:

| Variable | Use |
|---|---|
| `ALEGRA_BASE_URL` | `https://api.alegra.com/api/v1` |
| `ALEGRA_TOKEN` | Already-encoded Basic credential. Header `authorization: Basic {token}`. |
| `ALEGRA_PRICE_LIST_MAJOR_ID` | Wholesale price list (precio al por mayor). |
| `ALEGRA_PRICE_LIST_MINOR_ID` | Retail price list (precio al detal). |

Every call sends `accept: application/json` and `content-type: application/json`.

**One `PUT {ALEGRA_BASE_URL}/items/{alegraId}` per save.** The body contains only the changed parts:

| What changed | Body |
|---|---|
| Name only | `{ "name" }` |
| Wholesale price only | `{ "price": [ { "idPriceList": major, "price" } ] }` |
| Retail price only | `{ "price": [ { "idPriceList": minor, "price" } ] }` |
| Both prices | `{ "price": [ wholesale entry, retail entry ] }` |
| Name and one or both prices | `{ "name", "price": [ ...only the prices that changed ] }` |

Alegra receives only `name`, the wholesale sale price, and the retail sale price, and only when that field was in the update. Cost, units, and pack are persisted and are never sent. A sale price of `0` is persisted and is sent. The current client drops the retail list when the price is `0`; that drop is removed.

A non-200 response fails the Alegra call and does not roll back the local save.

**Not in the reference script.** Creating an Alegra item, retiring one, and listing items have no request in this feature. Local create and logical delete do not call Alegra.

## 4. Tests

- A wholesale price update writes only the wholesale row and notifies only that price list.
- A retail price update writes only the retail row and notifies only that price list.
- Both prices in one body update both rows and notify both lists in one Alegra request.
- `0` is stored for cost, sale price, units, and pack. A sale price of `0` is notified. A cost of `0` is not notified.
- A negative number is rejected. `null` and an empty string are rejected for every update field.
- An omitted field keeps its stored value.
- A cost, units, or pack change does not call Alegra. A name change notifies only the name.
- Update still returns the saved product when Alegra fails.
- Create persists the product and does not call Alegra.
- Retire hides the product from search and does not call Alegra.
- A sale line that already references a retired product still loads.

## 5. Definition of done

- The home entry and the product screens are specified in the UI [SPEC-003](../../../workspace/prime-sweets-ui/docs/specs/SPEC-003.md).
- Architecture, data-model, and flows describe only the code that has landed.
