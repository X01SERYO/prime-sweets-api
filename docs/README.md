# Documentation

**Language:** English is the official language for documentation and translation.

This index is the map of project documents. Runtime descriptions below match the current codebase. Version 1 product and design decisions live in the PDR, SPEC, and ADR; they are not described here as implemented.

## Document map

| Document | Role | Status vs code |
|---|---|---|
| [pdrs/PDR.md](./pdrs/PDR.md) | Product design requirement for Version 1 | Proposal. Not a description of the running API. |
| [specs/SPEC.md](./specs/SPEC.md) | Backend implementation specification for Version 1 | Proposed target. Use it as the implementation guide. Update *this* docs set as SPEC steps land; do not copy unimplemented SPEC content into architecture, data-model, or flows as if it existed. |
| [adrs/ADR-001.md](./adrs/ADR-001.md) | Architecture decision: modular monolith, DDD bounded contexts, hexagon per context | Proposed. Binding for Version 1. Current runtime shape is in `architecture/`. |
| [architecture/](./architecture/README.md) | C4 model of **the current API** | Implemented. One C4 set only. |
| [data-model/](./data-model/README.md) | Entities, tables, and relations verified in code and migrations | Implemented catalog persistence only. |
| [flows/](./flows/README.md) | Business/application flows verified in code | Catalog and Alegra outbound sync only. Pending Version 1 flows are listed, not invented. |
| [technical-debt.md](./technical-debt.md) | Central register of technical debt, hypotheses, and pending technical decisions | Active. Living register updated as items are resolved. |

## Keep / consolidate / create

| Action | Document | Reason |
|---|---|---|
| Keep | PDR, SPEC, ADR-001 | Product, implementation target, and architecture decision. Do not duplicate them as a second C4 “to-be” tree. |
| Consolidated | `architecture/as-is/*` and `architecture/to-be/*` | Two C4 models described the same system at two times and repeated SPEC/ADR content. Replaced by a single current C4 plus pointers to PDR/SPEC/ADR. |
| Created | `architecture/` (single C4) | Reflects Express API, `products`, `alegra`, PostgreSQL. |
| Created | `data-model/` | Verified `brands`, `products`, `product_prices` and domain mapping. |
| Created | `flows/` | Verified brand/product HTTP flows and product-update Alegra sync. |
| Created | `technical-debt.md` | Tracks confirmed debt, hypotheses, and pending decisions for progressive resolution. |

## SPEC coverage in the current codebase

| SPEC area | In code today |
|---|---|
| Catalog-like product/brand model, wholesale and retail prices | Yes — context name is `catalog` |
| Outbound catalog sync (not in SPEC context map; present in code) | Yes — `alegra` + `ProductAlegraSyncService` on product update |
| Catalog search by name, brand, or code | Yes — server search via `SearchProductsUseCase` (`GET /products/search?q=`) |
| Catalog Excel migration | No |
| Authentication | No |
| Customers | Yes — context name is `customers` (CRUD + search) |
| Sales Day | Yes — context name is `sales-day` (Open, Current, Close, Reopen) |
| Sales (draft/confirm/void, snapshots, invoice numbering) | No |
| Fulfillment Output (Load Sheet, invoice render/print) | No |
| Hexagonal folder convention (`adapters/`, `application/ports`) | Yes for `catalog` (`application/ports`, `adapters/inbound|outbound`); pending `alegra` normalization |

When a SPEC step is implemented, update `architecture/`, `data-model/`, and `flows/` to match the code. Do not mark SPEC sections as done only in the SPEC.
