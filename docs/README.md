# Documentation

**Language:** English is the official language for these documents. Seller-facing Spanish and English are a UI concern, specified in the UI SPEC. This API keeps stable error `code` values and does not translate stored business text (product names, customer names, sale-item names, company legal text, or invoice numbers).

This index is the map of project documents. Runtime descriptions below match the current codebase. Version 1 product and design decisions live in the PDR, SPEC, and ADR; they are not described here as implemented.

## Document map

| Document | Role | Status vs code |
|---|---|---|
| [pdrs/PDR.md](./pdrs/PDR.md) | Product design requirement for Version 1 | Proposal. Not a description of the running API. |
| [pdrs/PDR-002.md](./pdrs/PDR-002.md) | Current week, delivery date, and returns as sale edits | Proposal. Delivery-day behavior is in the code. This file stays the feature record. |
| [pdrs/PDR-003.md](./pdrs/PDR-003.md) | Product administration and Alegra | Proposal. Not implemented. |
| [specs/SPEC.md](./specs/SPEC.md) | Backend implementation specification for Version 1 | Proposed target. Use it as the implementation guide. Update *this* docs set as SPEC steps land; do not copy unimplemented SPEC content into architecture, data-model, or flows as if it existed. |
| [specs/SPEC-002.md](./specs/SPEC-002.md) | Implementation guide for PDR-002 | Proposed. Do not copy unimplemented parts into architecture, data-model, or flows. |
| [specs/SPEC-003.md](./specs/SPEC-003.md) | Implementation guide for PDR-003 | Proposed. Do not copy it into architecture, data-model, or flows until the code lands. |
| [adrs/ADR-001.md](./adrs/ADR-001.md) | Architecture decision: modular monolith, DDD bounded contexts, hexagon per context | Proposed. Binding for Version 1. Current runtime shape is in `architecture/`. |
| [adrs/ADR-002.md](./adrs/ADR-002.md) | Week window and delivery date stay in Sales and Fulfillment Output | Proposed. Binding for PDR-002. |
| [adrs/ADR-003.md](./adrs/ADR-003.md) | Product administration stays in catalog and Alegra | Proposed. Binding for PDR-003. |
| [architecture/](./architecture/README.md) | C4 model of **the current API** | Implemented. One C4 set only. |
| [data-model/](./data-model/README.md) | Entities, tables, and relations verified in code and migrations | Catalog, customers, sales, and the invoice sequence. There is no Sales Day table. Load Sheet, invoice list, and invoice document are projections and have no table. |
| [flows/](./flows/README.md) | Business/application flows verified in code | Identity, catalog, customers, sales by delivery date, Load Sheet, invoice listing, invoice generation, and Alegra outbound sync. Remaining gaps are listed, not invented. |
| [technical-debt.md](./technical-debt.md) | Central register of technical debt, hypotheses, and pending technical decisions | Active. Living register updated as items are resolved. |

## Keep / consolidate / create

| Action | Document | Reason |
|---|---|---|
| Keep | PDR, SPEC, ADR-001 | Product, implementation target, and architecture decision. Do not duplicate them as a second C4 “to-be” tree. |
| Consolidated | `architecture/as-is/*` and `architecture/to-be/*` | Two C4 models described the same system at two times and repeated SPEC/ADR content. Replaced by a single current C4 plus pointers to PDR/SPEC/ADR. |
| Created | `architecture/` (single C4) | Current Express API, bounded contexts, PostgreSQL, and Alegra outbound sync. |
| Created | `data-model/` | Verified `brands`, `products`, `product_prices`, `customers`, `sales_days`, `sales`, `sale_items`, and `invoice_sequences`. |
| Created | `flows/` | Verified catalog, customer, Sales Day, sales, Load Sheet, invoice list, invoice document, and Alegra outbound flows. |
| Created | `technical-debt.md` | Tracks confirmed debt, hypotheses, and pending decisions for progressive resolution. |

## SPEC coverage in the current codebase

| SPEC area | In code today |
|---|---|
| Catalog-like product/brand model, wholesale and retail prices | Yes — context name is `catalog` |
| Outbound catalog sync (not in SPEC context map; present in code) | Yes — `alegra` + `ProductAlegraSyncService` on product update |
| Catalog search by name, brand, or code | Yes — server search via `SearchProductsUseCase` (`GET /products/search?q=`) |
| Catalog Excel migration | No |
| Authentication | Yes — `identity`: login, session lookup, logout, and bearer checks on business routes |
| Customers | Yes — context name is `customers` (CRUD + search) |
| Sales Day | Removed. Delivery date lives on the sale. See [PDR-002](./pdrs/PDR-002.md). |
| Sales (draft/confirm/void, snapshots, invoice numbering) | Yes — context name is `sales` |
| Fulfillment Output (Load Sheet, invoice render/print) | API: `GenerateLoadSheet` via `GET /load-sheets?deliveryDate=`, `ListInvoices` via `GET /invoices?deliveryDate=`, and `GenerateInvoice` via `GET /invoices/:saleId`. Printing is the UI, through the Windows print dialog (PDR OQ-04). |
| Hexagonal folder convention (`adapters/`, `application/ports`) | Yes for `catalog`, `customers`, `sales-day`, `sales`, `fulfillment-output`, and `alegra`. |

When a SPEC step is implemented, update `architecture/`, `data-model/`, and `flows/` to match the code. Do not mark SPEC sections as done only in the SPEC.
