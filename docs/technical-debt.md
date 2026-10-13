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
| **TD-03** | Leak of persistence entities in `src/shared` (Isolation violation) | `src/shared/infrastructure/persistence/typeorm/*.entity.ts`<br>`src/contexts/catalog/adapters/outbound/persistence/` | `ProductEntity`, `ProductPriceEntity`, `BrandEntity`, and `PriceListEntity` live under `src/shared/`. Per Hexagonal and DDD standards (`ADR-001`), `shared` must only hold cross-cutting kernel code; persistence entities belong to their specific bounded context adapter. | Move catalog entities and mappers into `src/contexts/catalog/adapters/outbound/persistence/entities/` and update DataSource entity registration. |
| **TD-04** | Inconsistent Hexagonal directory structure across contexts | `src/contexts/catalog/`<br>`src/contexts/alegra/` | `catalog` uses `application/ports/` and `adapters/inbound\|outbound/`. Meanwhile, `alegra` uses legacy conventions (`domain/interfaces/` and `infrastructure/`). | Refactor `alegra` directory layout to follow standard Ports & Adapters convention (`domain/`, `application/ports/outbound/`, `adapters/outbound/http/`). |

### 2.2 Medium Priority (Domain Design, Robustness & Quality)

| ID | Item | Affected Components / Files | Problem Description | Required Corrective Action |
|---|---|---|---|---|
| **TD-05** | Automated test suite setup and coverage | Repository root<br>`package.json`<br>`src/**/*.test.ts` | **[IN PROGRESS]** Configured native test runner (`npm test` via `node --test`) in `package.json`. Unit tests exist for catalog search, customers, Sales Day, sales, `GenerateLoadSheet`, `ListInvoices`, and `GenerateInvoice`. Remaining use cases, domain aggregates, and HTTP adapter mappings still require coverage. | Continue expanding unit tests as each use case and domain aggregate is implemented/touched. |
| **TD-06** | Duplication and inconsistent naming in DTOs | `src/contexts/catalog/application/dto/createBrand.dto.ts`<br>`src/contexts/catalog/application/dto/createBrand.interface.ts`<br>`updateBrand.dto.ts` | Redundant interface definitions exist (e.g. `createBrand.dto.ts` re-exporting `createBrand.interface.ts`), and some DTOs use the suffix `Interface` instead of `Dto`. | Consolidate DTOs under a single standard (`*Dto`), colocating them with use cases or in `application/dto/`, eliminating redundant re-exports. |
| **TD-07** | ~~Lack of HTTP input schema validation~~ | `src/apps/middlewares/validateRequest.ts`<br>`src/contexts/**/adapters/inbound/http/*.schema.ts` | **[RESOLVED]** Integrated Zod validation via `validateRequest` middleware and separate `*.schema.ts` files across all bounded contexts (`brands`, `products`, `customers`, `sales-days`). Input validation for `body`, `params`, and `query` executes at the HTTP boundary before use cases are invoked. | Resolved in Sales Day / Customer / Catalog phase. |
| **TD-08** | Inconsistent domain error handling | `src/contexts/catalog/domain/entities/brand.ts`<br>`src/contexts/catalog/domain/entities/product.ts` | `Brand.create` throws generic `Error('Brand name is required')`, whereas `Product` and use cases use typed `DomainError` subclasses and `Result.fail()`. This causes HTTP 500 instead of 400 when validation fails. | Standardize all domain invariant violations on subclasses of `DomainError` and ensure use cases capture them via `Result`. |
| **TD-09** | Weak TypeScript typing (`any` in adapters and DI) | `src/apps/api/routes/*.ts`<br>`src/apps/api/app.ts`<br>`src/contexts/catalog/adapters/outbound/persistence/repositories/typeOrmProduct.repository.ts` | `container: any` is passed into routes, and callback parameters in repository methods lack explicit types (e.g. `(price) => price...`), creating strict compiler warnings and loss of safety. | Type the dependency container interface and provide explicit type annotations on repository transformation callbacks. |
| **TD-10** | Synchronous coupling in Alegra external integration | `src/contexts/catalog/application/use-cases/updateProduct/updateProduct.useCase.ts`<br>`src/contexts/alegra/infrastructure/sync/inProcessProductAlegraSync.service.ts` | `UpdateProductUseCase` persists changes to PostgreSQL and immediately makes an in-process HTTP call to Alegra API. If Alegra fails or hangs, the HTTP request fails even though local DB updated, with no outbox or compensating retry. | Decouple external sync via domain events or a background transactional outbox mechanism. |

### 2.3 Low Priority (Ergonomics, Config & Style)

| ID | Item | Affected Components / Files | Problem Description | Required Corrective Action |
|---|---|---|---|---|
| **TD-11** | Unvalidated, scattered `process.env` access | `src/main.ts`<br>`src/apps/api/server.ts`<br>`src/shared/infrastructure/persistence/typeorm/data-source.ts`<br>`src/contexts/fulfillment-output/adapters/outbound/envCompanyProfile.adapter.ts` | Environment variables are read directly via `process.env` with ad-hoc defaults without centralized startup schema validation. Invoice generation treats a missing company field as `CompanyProfileNotConfiguredError` at request time rather than failing at boot. | Centralize configuration in a validated config service/module that fails fast on application boot if critical variables are missing. |
| **TD-12** | ~~Mixed module export styles~~ | `src/contexts/catalog/application/use-cases/*`<br>`src/contexts/customers/*`<br>`src/contexts/alegra/*`<br>`src/apps/dependency-injection/*` | **[RESOLVED]** Migrated dependency injection wiring from brittle YAML paths to modular TypeScript modules (`*.di.ts`). Removed all redundant `export default` statements across all use cases, repositories, and adapters, enforcing 100% typed named exports (`export class X`). | Resolved in Customer implementation phase. |

---

## 3. Hypotheses to Validate (Hipótesis y Aspectos a Verificar)

Assumptions that require profiling, load testing, or codebase audits before deciding on an implementation change.

| ID | Hypothesis | Proposed Verification | Risk / Potential Impact |
|---|---|---|---|
| **H-01** | Synchronous Alegra HTTP call causes latency spikes and thread blocking on bulk product updates. | Measure p95/p99 latency of `PUT /products/:id` with varying network delays to the external Alegra sandbox/endpoint. | High latency experienced by mobile sellers when updating catalog entries under unstable connectivity. |
| **H-02** | `priceList.entity.ts` is orphaned dead code or represents an incomplete migration. | Audit if `priceList` is actively required by the current TypeORM schema or if pricing was entirely migrated to `product_prices` (channel wholesale/retail). | Dead code maintenance overhead and confusion in data model documentation (`docs/data-model/README.md`). |
| **H-03** | Concurrent price updates on the same product could lead to race conditions in `upsertChannelPrice`. | Review `TypeOrmProductRepository.upsertChannelPrice` which does a `findOne` followed by `save`. Test with concurrent updates. | Database unique constraint violations or overwriting channel prices under concurrent requests. |

---

## 4. Pending Technical & Architectural Decisions (Decisiones Pendientes)

Decisions that must be agreed upon before completing subsequent modules of Version 1.

| ID | Decision Area | Options Considered | Recommendation | Related Docs |
|---|---|---|---|---|
| **DEC-01** | TypeScript Path Aliases vs Relative Imports | **A:** Use tsconfig path aliases (`@catalog/*`, `@shared/*`).<br>**B:** Maintain strict normalized relative paths. | **Option A** — Eliminates brittle multi-level relative paths (`../../..`) that caused TD-01. | `tsconfig.json`, `ADR-001` |
| **DEC-02** | Adoption of Domain Value Objects (`Price`, `Quantity`, `Sku`) | **A:** Keep primitives (`number`, `string`) with use-case validation.<br>**B:** Implement dedicated Value Objects in `domain/value-objects/`. | **Option B** — Enforces business invariants at the domain boundary, removing duplicate checks across use cases. | `.cursor/skills/backend-hexagonal-ddd/` |
| **DEC-03** | Resilience Strategy for External Integrations (Alegra) | **A:** Transactional Outbox pattern with background worker.<br>**B:** Retry queue with exponential backoff.<br>**C:** Direct HTTP with asynchronous Event Emitter. | Start with **Option C (in-process events)** for Version 1 modular monolith, graduating to **Option A** if webhook/sync volume increases. | `docs/flows/README.md`, `ADR-001` |
| **DEC-04** | Input Schema Validation Library | **A:** Zod.<br>**B:** Joi / Express-validator.<br>**C:** Class-validator with decorators. | **Option A (Zod)** — Lightweight, TypeScript-first, zero decorators, ideal for functional request decoding. | `package.json` |

---

## 5. Non-Duplicated Cross-References

To preserve a single source of truth across the project:

- **Business Domain Open Questions (OQ-01 through OQ-21):** Maintained in [docs/pdrs/PDR.md § 17 — Open Questions and Decisions](./pdrs/PDR.md#17-open-questions-and-decisions-oq-register). Includes invoice uniqueness scope, printer hardware model, seller multi-device sessions, customer route assignment, etc.
- **Unimplemented Version 1 Core Modules:** Maintained in [docs/flows/README.md § Pending definition / not implemented](./flows/README.md#pending-definition--not-implemented). Includes Authentication, invoice printing, and catalog Excel migration. Load Sheet generation, invoice listing, and invoice document generation are implemented.
- **Architectural Guidelines:** Maintained in [docs/adrs/ADR-001.md](./adrs/ADR-001.md) and [.cursor/skills/backend-hexagonal-ddd/SKILL.md](../.cursor/skills/backend-hexagonal-ddd/SKILL.md).
