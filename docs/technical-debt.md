# Technical Debt Register

**Document Role:** Central register of technical debt, code anomalies, architectural drift, hypotheses, and pending technical definitions identified in the codebase.
**Objective:** Track, maintain visibility, and progressively reduce technical debt during the development of Version 1, updating this registry and related architecture documents as items are resolved.
**Status:** Active — updated following repository review.

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
| **TD-05** | Automated test suite setup and coverage | Repository root<br>`package.json`<br>`src/test/unit/**/*.test.ts`<br>`src/test/integration/**/*.test.ts` | **[IN PROGRESS]** Configured native test runner (`npm test`, `npm run test:unit`, `npm run test:integration`) in `package.json`. Unit tests cover catalog search, customers, Sales Day, sales, `GenerateLoadSheet`, `ListInvoices`, and `GenerateInvoice`. The integration suite wires the dependency container. Remaining use cases, domain aggregates, and HTTP adapter mappings still require coverage. | Continue expanding unit tests as each use case and domain aggregate is implemented/touched. Add database and HTTP integration tests when those adapters are exercised against PostgreSQL. |
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

---

## 3. Hypotheses to Validate (Hipótesis y Aspectos a Verificar)

Assumptions that require profiling, load testing, or codebase audits before deciding on an implementation change.

| ID | Hypothesis | Proposed Verification | Risk / Potential Impact |
|---|---|---|---|
| **H-01** | Synchronous Alegra HTTP call causes latency spikes and thread blocking on bulk product updates. | Measure p95/p99 latency of `PUT /products/:id` with varying network delays to the external Alegra sandbox/endpoint. | High latency experienced by mobile sellers when updating catalog entries under unstable connectivity. |
| **H-02** | ~~`priceList.entity.ts` is orphaned dead code.~~ | **[RESOLVED]** It was not registered in the DataSource or in migrations. The file was removed. Channel prices stay on `product_prices`. | None. |
| **H-03** | Concurrent price updates on the same product could lead to race conditions in `upsertChannelPrice`. | Review `TypeOrmProductRepository.upsertChannelPrice` which does a `findOne` followed by `save`. Test with concurrent updates. | Database unique constraint violations or overwriting channel prices under concurrent requests. |

---

## 4. Pending Technical & Architectural Decisions (Decisiones Pendientes)

Decisions that must be agreed upon before completing subsequent modules of Version 1.

| ID | Decision Area | Options Considered | Recommendation | Related Docs |
|---|---|---|---|---|
| **DEC-01** | TypeScript Path Aliases vs Relative Imports | **A:** Use tsconfig path aliases (`@catalog/*`, `@shared/*`).<br>**B:** Maintain strict normalized relative paths. | **Option A** — Eliminates brittle multi-level relative paths (`../../..`) that caused TD-01. | `tsconfig.json`, `ADR-001` |
| **DEC-02** | Adoption of Domain Value Objects (`Price`, `Quantity`, `Sku`) | **A:** Keep primitives (`number`, `string`) with use-case validation.<br>**B:** Implement dedicated Value Objects in `domain/value-objects/`. | **Option B** — Enforces business invariants at the domain boundary, removing duplicate checks across use cases. | `.cursor/skills/backend-hexagonal-ddd/` |
| **DEC-03** | Resilience Strategy for External Integrations (Alegra) | **A:** Transactional Outbox pattern with background worker.<br>**B:** Retry queue with exponential backoff.<br>**C:** Direct HTTP with asynchronous Event Emitter. | Start with **Option C (in-process events)** for Version 1 modular monolith, graduating to **Option A** if webhook/sync volume increases. | `docs/flows/README.md`, `ADR-001` |
| **DEC-04** | Input Schema Validation Library | **A:** Zod.<br>**B:** Joi / Express-validator.<br>**C:** Class-validator with decorators. | **[DECIDED] Option A (Zod).** Implemented in `validateRequest` and the `*.schema.ts` files. | `package.json`, `src/apps/middlewares/validateRequest.ts` |

---

## 5. Non-Duplicated Cross-References

To preserve a single source of truth across the project:

- **Business Domain Open Questions:** Maintained in [docs/pdrs/PDR.md § 17 — Open Questions and Decisions](./pdrs/PDR.md#17-open-questions-and-decisions-oq-register). OQ-01, OQ-02, OQ-03, OQ-04, OQ-05, OQ-06, OQ-07, and OQ-09 are answered there. Daily invoice numbers are what `InvoiceNumberAllocator` emits.
- **Unimplemented Version 1 Core Modules:** Maintained in [docs/flows/README.md § Pending definition / not implemented](./flows/README.md#pending-definition--not-implemented). Includes Authentication and catalog Excel migration. Load Sheet generation, invoice listing, and invoice document generation are implemented. Invoice printing is the UI, through the Windows print dialog.
- **Architectural Guidelines:** Maintained in [docs/adrs/ADR-001.md](./adrs/ADR-001.md) and [.cursor/skills/backend-hexagonal-ddd/SKILL.md](../.cursor/skills/backend-hexagonal-ddd/SKILL.md).
