# Technical Debt Register

**Document Role:** Central register of technical debt, code anomalies, architectural drift, hypotheses, and pending technical definitions identified in the codebase.
**Objective:** Track, maintain visibility, and progressively reduce technical debt during the development of Version 1, updating this registry and related architecture documents as items are resolved.
**Status:** Active — last review 2026-11-17.

---

## 1. Overview and Governance

This document records technical compromises, structural drift, and missing architectural standards that exist in the codebase but are **not** immediately resolved in the current phase to avoid uncoordinated scope creep.

### Lifecycle & Resolution Rules
1. **No Scope Creep:** Items documented here must be resolved incrementally in scheduled refactoring tasks or when touching the affected bounded context.
2. **Synchronized Updates:** When a technical debt item is fixed:
   - Mark the item as `RESOLVED` in this document with reference to the PR / commit.
   - Update the corresponding C4 documentation in `docs/architecture/`, data model in `docs/data-model/`, or flows in `docs/flows/`.
3. **Non-duplication:** Business questions and unimplemented functional modules defined in `docs/pdrs/PDR.md` (OQ Register) and `docs/flows/README.md` are referenced here, not re-invented or duplicated.

---

## 2. Confirmed Technical Debt (Deuda Técnica Confirmada)

Defects, inconsistencies, and violations of project architectural standards (`ADR-001` and `.cursor/skills/backend-hexagonal-ddd/`) verified directly in code.

### 2.1 High Priority (Critical / Blocking / Architectural Drift)

| ID | Item | Affected Components / Files | Problem Description | Required Corrective Action |
|---|---|---|---|---|
| **TD-01** | ~~Broken TypeScript imports & compilation errors~~ | `src/contexts/catalog/application/use-cases/*`<br>`src/apps/api/routes/index.ts`<br>`src/contexts/catalog/adapters/outbound/persistence/repositories/*` | **[RESOLVED]** All 67 compiler errors resolved. Fixed relative paths and router imports; `npx tsc --noEmit` and `npm run build` pass with 0 errors. | Resolved in Step 1. |
| **TD-02** | ~~Bounded Context naming discrepancy (`catalog` vs `products`)~~ | `src/apps/dependency-injection/context/product.yaml`<br>`src/contexts/alegra/infrastructure/sync/inProcessProductAlegraSync.service.ts` | **[RESOLVED]** Aligned DI YAML service keys and class paths to `catalog.*`. Aligned cross-context imports from Alegra to `contexts/catalog`. | Resolved in Step 1. |
| **TD-03** | ~~Leak of persistence entities in `src/shared`~~ | `src/contexts/catalog/adapters/outbound/persistence/entities/` | **[RESOLVED]** `BrandEntity`, `ProductEntity`, and `ProductPriceEntity` live in the catalog persistence adapter. The unused `PriceListEntity` was removed. | Resolved with the catalog persistence move. |
| **TD-04** | ~~Inconsistent Hexagonal directory structure across contexts~~ | `src/contexts/alegra/` | **[RESOLVED]** Alegra client port lives in `application/ports/outbound/`. The HTTP client lives in `adapters/outbound/http/`. | Resolved with the Alegra layout move. |

### 2.2 Medium Priority (Domain Design, Robustness & Quality)

| ID | Item | Affected Components / Files | Problem Description | Required Corrective Action |
|---|---|---|---|---|
| **TD-05** | ~~Coverage below the 85% line target~~ | `package.json` `test:coverage` | **[RESOLVED]** `c8 --all` over every file in `dist` except the tests: **86.81% lines** (5570/6416) and 85.73% statements, 158 tests, 0 failures. The report includes migrations, HTTP routers, repositories (with a fake data source), and the Alegra client. | None. |
| **TD-06** | ~~Duplication and inconsistent naming in DTOs~~ | `src/contexts/catalog/application/dto/` | **[RESOLVED]** `CreateBrandDto` and `UpdateBrandDto` are the only brand command types. The `Interface` aliases were removed. | Resolved in the catalog DTO cleanup. |
| **TD-07** | ~~Lack of HTTP input schema validation~~ | `src/apps/middlewares/validateRequest.ts`<br>`src/contexts/**/adapters/inbound/http/*.schema.ts` | **[RESOLVED]** Integrated Zod validation via `validateRequest` middleware and separate `*.schema.ts` files for brands, products, customers, sales days, sales, load sheets, and invoices. Input validation for `body`, `params`, and `query` executes at the HTTP boundary before use cases are invoked. | Resolved in Sales Day / Customer / Catalog phase and extended with each later HTTP route. |
| **TD-08** | ~~Inconsistent domain error handling~~ | `src/contexts/catalog/domain/entities/brand.ts` | **[RESOLVED]** `Brand.create` throws `InvalidBrandError`. Product updates fail through `InvalidProductError` and `Result.fail`. | Resolved before this pass; covered by `brand.test.ts`. |
| **TD-09** | ~~Weak TypeScript typing (`any` in adapters and DI)~~ | `src/apps/dependency-injection/appContainer.ts` | **[RESOLVED]** HTTP routers, the app, and the session middleware take `AppContainer`, whose `get` overloads return the use case for each service id. Product price callbacks are typed as `ProductPriceEntity`. | Resolved with `AppContainer`. |
| **TD-10** | ~~Synchronous coupling in Alegra external integration~~ | `src/contexts/catalog/application/use-cases/updateProduct/updateProduct.useCase.ts` | **[RESOLVED]** The local product is saved first. An Alegra failure is logged and does not turn the already stored update into an HTTP error. Retry remains a later operations concern; there is no outbox. | Resolved by keeping the catalog write independent of the Alegra call. |

### 2.3 Low Priority (Ergonomics, Config & Style)

| ID | Item | Affected Components / Files | Problem Description | Required Corrective Action |
|---|---|---|---|---|
| **TD-11** | ~~Unvalidated, scattered `process.env` access~~ | `src/shared/infrastructure/config/appConfig.ts`<br>`src/main.ts`<br>`src/apps/api/server.ts`<br>`src/shared/infrastructure/persistence/typeorm/typeOrmDataSource.ts` | **[RESOLVED]** Environment variables are parsed once by `loadAppConfig` (Zod) before the container starts. `DB_USER` and `DB_NAME` are required and fail startup when missing. Database host/port, HTTP port, and the business timezone keep their existing defaults. Alegra and company profile values are centralized; a blank company profile still fails invoice generation with `CompanyProfileNotConfiguredError` instead of blocking the whole API. | Resolved in the configuration step. |
| **TD-12** | ~~Mixed module export styles~~ | `src/contexts/catalog/application/use-cases/*`<br>`src/contexts/customers/*`<br>`src/contexts/alegra/*`<br>`src/apps/dependency-injection/*` | **[RESOLVED]** Migrated dependency injection wiring from brittle YAML paths to modular TypeScript modules (`*.di.ts`). Removed all redundant `export default` statements across all use cases, repositories, and adapters, enforcing 100% typed named exports (`export class X`). | Resolved in Customer implementation phase. |

### 2.4 Open after the 2026-11-17 review

Confirmed in code. Nothing here is unused with enough confidence to delete. Pass-through use cases that only call a port are not debt.

| ID | Priority | Item | Affected files | Problem | Corrective action |
|---|---|---|---|---|---|
| **TD-13** | P1 | `Product` does not protect its invariants | `src/contexts/catalog/domain/entities/product.ts`<br>`createProduct.useCase.ts`<br>`updateProduct.useCase.ts` | `create` and `update` assign fields and uppercase the name. They do not reject an empty name, a negative price, or an invalid count. Those checks live in the use cases as different local helpers (`optionalNumber` vs `presentMoney` / `presentCount`). Mappers rehydrate with `Product.create`, so every read runs `upperName` again. TD-08 fixed `Brand` and the use-case `Result`; the entity is still anemic. | Move the invariants into the entity. Add `rehydrate` for reads, as `PurchaseOrder` and `RetailDay` already do. |
| **TD-14** | P1 | Create and update purchase order duplicate the same orchestration | `createPurchaseOrder.useCase.ts` (lines 31–57)<br>`updatePurchaseOrder.useCase.ts` (lines 33–59) | Both resolve the supplier, the product link, the catalog read, cost `<= 0`, and the line snapshot. Update imports `CreatePurchaseOrderLineDto` from the create file. | One application function builds the lines. Keep two use cases. |
| **TD-15** | P1 | Domain errors collapse to HTTP 400 | `src/apps/controllers/httpResponse.ts` lines 33–46 | Only `RETAIL_DAY_CLOSED` and `RETAIL_DAY_ALREADY_REVIEWED` return 409. Every other `DomainError`, including conflicts such as a duplicate customer, returns 400 and sends `error.message`. | Map existing stable codes to status. Do not add new codes in that change. Keep the translated text in the adapter. |
| **TD-16** | P2 | Alegra use cases skip `Result` | `src/contexts/alegra/application/createProductItem/`<br>`syncProductItem/` | No entities. Files are not under `use-cases/`. `run` returns `Promise<string>` or `Promise<void>`. Registered in DI and used by the ACL. Not dead code. | Return `Result` and move the files under `application/use-cases/`. Do not invent an entity for an HTTP client. |
| **TD-17** | P2 | Price row ids are created in the repository | `typeOrmProduct.repository.ts` | `randomUUID` from `crypto` assigns the price id. The project standard asks the use case to take new ids from `IdGenerator`. | Generate the id in the use case and persist it as given. |
| **TD-18** | P2 | `Sale.create` both builds and reloads | `src/contexts/sales/domain/entities/sale.ts`<br>`sale.mapper.ts`<br>`setSaleDeliveryDate.useCase.ts` | Draft creation is `Sale.start`. The mapper loads rows with `Sale.create` / `SaleItem.create`. There is no `rehydrate`. The delivery-date use case calls `sale.void()` on an already voided sale to force `SaleAlreadyVoidedError`, and `catch` does `Result.fail(error as Error)` for any exception. | Add `rehydrate`. Return the domain error without calling `void()`. Catch only `DomainError`. |
| **TD-19** | P3 | Use-case signatures and DTO locations differ | purchasing `run(supplierId, lines, assortment)` and `run(name: string)`; catalog, customers, and sales gets/deletes use `run(id: string)`; retail types live inside the use case; Alegra uses an anonymous object | File DTOs exist for catalog, sales, customers, fulfillment, and identity. The purchase line DTO lives in the create use case. | Add a DTO file per purchasing and retail use case. Leave `run(id)` as it is. |
| **TD-20** | P3 | DI keys name the domain for a TypeORM adapter | `src/apps/dependency-injection/` | Keys such as `sales.domain.sale_repository`, `catalog.domain.product_repository`, `purchasing.domain.supplier_repository`, `customers.domain.customer_repository`, `retail.domain.retail_day_repository`. Folders are `retail-sales`, `fulfillment-output`, and `customers`. | Rename to `*.repository` without the `domain` segment, aligned with the folder, in one composition change. |
| **TD-21** | P3 | Same error `code` in different contexts | catalog, sales, and fulfillment `PRODUCT_NOT_FOUND`, `CUSTOMER_NOT_FOUND`, `SALE_NOT_FOUND` | The client cannot tell “missing in catalog” from “missing on this sale”. | Prefix the code with the context when a consumer is confirmed. Do not change the contract in the same change as a rename. |
| **TD-22** | P2 | `GET /products` chooses the use case from the query | `products.route.ts` | A `query` value calls `search_products_use_case`; without it, `list_products_use_case`. The UI admin uses `GET /products?page`. Sale and retail search use `GET /products/search`. | Keep both routes. Document the split. Do not merge them without a consumer check. |
| **TD-23** | P3 | `GET /invoices/:saleId` reads as a query and runs `GenerateInvoiceUseCase` | `invoices.route.ts` | The HTTP verb is a read. The use case name says generate. The UI calls the same GET. | Keep the GET. Rename only after confirming no other client depends on the use-case name. |

---

## 3. Hypotheses to Validate (Hipótesis y Aspectos a Verificar)

Assumptions that require profiling, load testing, or codebase audits before deciding on an implementation change.

| ID | Hypothesis | Proposed Verification | Risk / Potential Impact |
|---|---|---|---|
| **H-01** | ~~Synchronous Alegra HTTP call causes latency spikes and thread blocking on bulk product updates.~~ | **[CLOSED]** Version 1 keeps the call on the same request, after the local save. A slow Alegra response is an operations measurement, not a code change. | None for this version. The saved product is still returned when Alegra fails. |
| **H-02** | ~~`priceList.entity.ts` is orphaned dead code.~~ | **[RESOLVED]** It was not registered in the DataSource or in migrations. The file was removed. Channel prices stay on `product_prices`. | None. |
| **H-03** | ~~Concurrent price updates on the same product could lead to race conditions in `upsertChannelPrice`.~~ | **[RESOLVED]** The channel price is inserted with `ON CONFLICT (product_id, channel) DO UPDATE` of `cost`, `price`, and `updated_at`. Two saves of the same product no longer read the row before writing it. A null price still deletes that channel. | None. |
| **H-04** | `InMemorySessionStore` is only a test double sitting in `adapters/` | `src/contexts/identity/adapters/outbound/inMemorySession.store.ts` is not in `identity.di.ts`. `login.useCase.test.ts` and its unit test use it. | Move under `test/` only after confirming no local boot constructs it. |
| **H-05** | These routes have no caller in `prime-sweets-ui`. They are not obsolete. | `GET /auth/session`; `GET /brands/:id`, `PUT /brands/:id`, `DELETE /brands/:id`; `GET /products/:id`, `DELETE /products/:id`; `GET /customers` (same use case as `GET /customers/search`); `GET /retail-days/:date`. | Confirm external consumers before removing or collapsing any path. |
| **H-06** | `GET /customers` and `GET /customers/search` are one contract twice | `customers.route.ts` maps both to `search_customers_use_case`. The UI calls `/customers/search` and `/customers/:id`. | Collapse only after H-05 confirms no external caller of `GET /customers`. |

---

## 4. Pending Technical & Architectural Decisions (Decisiones Pendientes)

Decisions that must be agreed upon before completing subsequent modules of Version 1.

| ID | Decision Area | Options Considered | Recommendation | Related Docs |
|---|---|---|---|---|
| **DEC-01** | TypeScript Path Aliases vs Relative Imports | **A:** Use one tsconfig path alias (`@/*` → `src/*`).<br>**B:** Maintain strict normalized relative paths. | **[DECIDED] Option A.** Parent imports use `@/apps`, `@/contexts/<context>`, and `@/shared`. `tsc` does not rewrite them, so `build` runs `tsc-alias` and dev/migrations load `tsconfig-paths`. | `tsconfig.json` |
| **DEC-02** | Adoption of Domain Value Objects (`Price`, `Quantity`, `Sku`) | **A:** Keep primitives (`number`, `string`) with use-case validation.<br>**B:** Implement dedicated Value Objects in `domain/value-objects/`. | **Option B** — Enforces business invariants at the domain boundary, removing duplicate checks across use cases. | `.cursor/skills/backend-hexagonal-ddd/` |
| **DEC-03** | Resilience Strategy for External Integrations (Alegra) | **A:** Transactional Outbox pattern with background worker.<br>**B:** Retry queue with exponential backoff.<br>**C:** Direct HTTP with asynchronous Event Emitter. | **[DECIDED]** Version 1 keeps the current path: save the product, then call Alegra on the same request. A failure is logged and the saved product is returned. No outbox and no extra event emitter. | `docs/flows/README.md` |
| **DEC-04** | Input Schema Validation Library | **A:** Zod.<br>**B:** Joi / Express-validator.<br>**C:** Class-validator with decorators. | **[DECIDED] Option A (Zod).** Implemented in `validateRequest` and the `*.schema.ts` files. | `package.json`, `src/apps/middlewares/validateRequest.ts` |

---

## 5. Review on 2026-11-14

Checked against the running contexts `identity`, `catalog`, `customers`, `sales`, `fulfillment-output`, and `alegra`.

| Check | Result |
|---|---|
| Coverage | **[RESOLVED]** TD-05 stays at 86.81% lines. |
| `sales-day` context and `/sales-days` routes | **[RESOLVED]** Removed from code. `docs/architecture/03-component.md` and the product list in `docs/flows/README.md` now match delivery-date sales, paged products, and the Alegra port layout. |
| Unused imports or orphan modules | No unused context was deleted in this pass. `PriceListEntity` was already removed (H-02). |
| PDR-004 retail | Documented only. Not implemented. Not debt. |

Runtime is Node.js 26 and TypeScript 6. ESLint is on 10 with `eslint.config.mjs`. `npm run lint` passes. The four `no-explicit-any` warnings in the request-validation test stay warnings, as before.

Still open: DEC-02. DEC-01 is decided: parent imports use the path aliases above. H-01 and DEC-03 are closed: version 1 keeps the direct Alegra call after the local save. H-03 is resolved.

## 6. Review on 2026-11-17

Read-only pass over `catalog`, `customers`, `sales`, `retail-sales`, `purchasing`, `identity`, `fulfillment-output`, and `alegra`, and over the UI HTTP adapters. No code was changed.

| Check | Result |
|---|---|
| Dependency direction | Domain does not import Express, TypeORM, or `crypto`. No context imports another context’s repository. Cross-context reads stay in `src/apps/dependency-injection/acl/`. |
| Dead code safe to delete | None. All use cases are registered in `src/apps/dependency-injection/` and the ten `*.route.ts` files are mounted from `src/apps/api/routes/index.ts`. |
| Needs a consumer check | H-04, H-05, H-06. |
| Secrets | `User.toPrimitives()` does not include the password hash. |
| Open work | TD-13 through TD-23. Suggested order: TD-13, TD-14, TD-15, then TD-16–TD-18, then renames in TD-19–TD-21 and TD-23. |

## 7. Non-Duplicated Cross-References

To preserve a single source of truth across the project:

- **Business Domain Open Questions:** Maintained in [docs/pdrs/PDR.md § 17 — Open Questions and Decisions](./pdrs/PDR.md#17-open-questions-and-decisions-oq-register). OQ-01, OQ-02, OQ-03, OQ-04, OQ-05, OQ-06, OQ-07, and OQ-09 are answered there. Daily invoice numbers are what `InvoiceNumberAllocator` emits.
- **Unimplemented Version 1 Core Modules:** Maintained in [docs/flows/README.md § Pending definition / not implemented](./flows/README.md#pending-definition--not-implemented). Authentication, Load Sheet generation, invoice listing, and invoice document generation are implemented. Catalog Excel migration, Alegra inbound pull, and create/retire product sync moved to [PDR-003](./pdrs/PDR-003.md). Invoice printing is the UI, through the Windows print dialog.
- **Architectural Guidelines:** Maintained in [docs/adrs/ADR-001.md](./adrs/ADR-001.md) and [.cursor/skills/backend-hexagonal-ddd/SKILL.md](../.cursor/skills/backend-hexagonal-ddd/SKILL.md).
