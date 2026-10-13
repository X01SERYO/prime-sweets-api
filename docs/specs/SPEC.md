# SPEC — Backend Domain and Application Specification

**Status:** Proposed
**Language:** English
**Architecture:** Domain-Driven Design + Hexagonal Architecture
**Deployment model:** Modular monolith for Version 1
**Document role:** Target implementation specification for Version 1. It is the implementation guide, not a description of the current codebase.
**Current implementation:** Partial. See [docs/README.md](../README.md). Do not treat unimplemented contexts, use cases, or tables in this file as existing. Update `docs/architecture`, `docs/data-model`, and `docs/flows` when a step in this SPEC is implemented.

## 1. Specification Goals

This specification defines the backend behavior, domain boundaries, application contracts, persistence responsibilities, adapter boundaries, validation rules, and testing requirements for the store-to-store sales application.

The implementation must preserve the business rules in the PDR and must not move business decisions into controllers, ORM entities, SQL queries, or frontend code.

## 2. Architectural Baseline

DDD is used for strategic and tactical modeling. Hexagonal Architecture is used to enforce dependency inversion between the core and external technologies. Current AWS guidance describes bounded contexts as business-oriented decomposition and ports/adapters as the boundary around the application core. citeturn0search0turn0search1

The application is initially a modular monolith. Each bounded context is a business module with explicit internal boundaries.

## 3. Context Map

```text
+----------------+       +----------------+
|   Customers    |       |    Catalog     |
+-------+--------+       +--------+-------+
        |                         |
        | customer reference      | product/pricing reference
        v                         v
                +----------------+
                |      Sales     |
                +--------+-------+
                         |
                         | belongs to
                         v
                +----------------+
                |   Sales Day    |
                +--------+-------+
                         |
                         | source for operational outputs
                         v
              +-----------------------+
              |  Fulfillment Output   |
              | Load Sheet / Invoice  |
              +-----------------------+
```

The diagram represents business relationships, not database foreign-key permission. A context must not reach into another context's persistence implementation.

## 4. Domain Context: Sales

### Responsibility

The Sales context owns the commercial transaction and its invariants.

### Aggregate

`Sale` is the aggregate root.

Suggested entities/value objects:

- `Sale`
- `SaleItem`
- `SaleId`
- `InvoiceNumber`
- `Quantity`
- `Money`
- `SaleStatus`
- `ProductSnapshot`

### Sale lifecycle

```text
DRAFT -> CONFIRMED -> VOIDED
```

A draft may be edited before confirmation. Confirmation is the business point at which the sale becomes a recorded transaction and receives its invoice number.

A confirmed sale may be logically voided while its Sales Day is open. The exact naming (`VOIDED`, `CANCELLED`, etc.) should be standardized during implementation, but physical deletion is prohibited.

### Required invariants

1. A sale must contain at least one item when confirmed.
2. Quantity must be positive.
3. Seller-entered quantity is expressed in units.
4. Product price cannot be changed by the seller during sale creation.
5. Wholesale sale price and wholesale cost used by the sale must be snapshotted.
6. Total price is `quantity × wholesale sale price`.
7. Profit is `total price − (wholesale cost × quantity)`.
8. A logically voided sale contributes nothing to Load Sheet calculations.
9. A confirmed sale's invoice number cannot be reused.
10. Invoice rendering cannot create a new Sale.

### Price/cost snapshot

The sale must retain the transaction-time values used for financial calculation. Later catalog changes must not alter historical sale totals.

The `SaleItem` stores a transaction-time `itemName`. When a product is selected, the Catalog product name is copied into `itemName` as the default value. During order capture, the seller may modify `itemName` immediately. The product `productId` remains immutable and is the authoritative Catalog identity. Once the sale is confirmed, the stored `itemName` is used by invoice rendering. It is not used by Load Sheet aggregation and it is not editable during invoice generation or printing.

## 5. Domain Context: Sales Day

### Responsibility

`Sales Day` controls daily operational editability.

### Aggregate

`SalesDay` is the aggregate root.

Fields/concepts:

- seller reference;
- calendar date;
- status: `OPEN | CLOSED`;
- sales references or a query-based relationship, depending on persistence design.

### Invariants

1. Only one current Sales Day may be active for the seller/date combination.
2. Sales can be created/edited/logically voided only while the Sales Day is `OPEN`.
3. Closing changes the day to `CLOSED`.
4. A closed Sales Day cannot be modified through normal sale commands.
5. Only the current calendar day's Sales Day may be reopened.
6. Reopening does not allocate new invoice numbers.
7. Historical Sales Days cannot be reopened.

The exact database strategy for determining "current day" must use the business timezone configured for the operation; it must not depend on the browser's local timezone.

## 6. Domain Context: Customers

### Responsibility

Customer identity and recurring customer information.

### Aggregate

`Customer` is the aggregate root.

Mandatory data:

- `documentType`
- `documentNumber`
- `name`

Additional electronic-invoicing fields are optional and informational in Version 1.

Customer document uniqueness remains an OQ and must not be silently assumed to be global until confirmed.

## 7. Domain Context: Catalog

### Responsibility

Products, brands, product identifiers, and current pricing information.

### Product model

The model must support the existing fields, including both wholesale and retail pricing fields.

The seller-facing sale flow uses wholesale pricing for Version 1.

### Search

Catalog search must support:

- product name;
- brand;
- direct product code.

Because the catalog contains more than 500 products, search must be server-supported or otherwise optimized rather than requiring the frontend to load and filter an unnecessarily large catalog on every sale.

## 8. Domain Context: Fulfillment Output

This context owns operational projections/document generation, not the source-of-truth Sale.

### Load Sheet

Input: valid sales belonging to a closed Sales Day.

Aggregation key: `productId`. This is the only product identity used to group SaleItems for the Load Sheet.

Output fields:

```text
BRAND
WHOLESALE COST
WHOLESALE SALE PRICE
NAME (from Catalog by productId)
QUANTITY
TOTAL PRICE
PROFIT
```

For each product:

```text
Aggregated Quantity = sum(valid sale item quantities)
Aggregated Total Price = sum(valid sale item total prices)
Aggregated Profit = sum(valid sale item profits)
```

Voided sales are excluded.

The transaction-time `SaleItem.itemName` is never an aggregation key and is never used to split a product into multiple Load Sheet rows. If two SaleItems share the same `productId` but have different `itemName` values, they are still aggregated into one Load Sheet row.

### Invoice rendering

The invoice renderer receives an existing Sale, including each SaleItem `productId` and transaction-time `itemName`, plus customer/company data, and produces the required document representation. The invoice displays the transaction-time `itemName` and the product ID. Rendering must be deterministic for the same input state.

Rendering is not a domain operation that changes the Sale aggregate.

## 9. Invoice Numbering

Invoice numbering is a business-critical operation and must be centralized and transactional.

At sale confirmation:

1. validate sale;
2. allocate the next valid invoice number through an outbound port;
3. persist the confirmed sale and allocated number atomically according to the selected transaction strategy;
4. return the confirmed sale and invoice number.

The numbering scope and initial number remain OQs.

Numbers are never reused after logical deletion.

## 10. State and Execution Flows

### 10.1 Sales Day state machine

```text
OPEN <------------------------------ CLOSED
 |                                      ^
 | Close                                |
 +--------------------------------------|
                                        |
                           Reopen current day only
```

Formal transitions:

| Current state | Command | Guard | Next state |
|---|---|---|---|
| OPEN | `CloseSalesDay` | Current day is open and close confirmation is accepted | CLOSED |
| CLOSED | `ReopenCurrentSalesDay` | Sales Day belongs to current business date | OPEN |
| CLOSED | `ReopenCurrentSalesDay` | Historical date | Rejected |

### 10.2 Sale state machine

```text
DRAFT --confirm--> CONFIRMED --logical delete--> VOIDED
  |                    |
  +------ edit --------+
```

The transition from `DRAFT` to `CONFIRMED` is the only point at which the invoice number is allocated. A confirmed Sale keeps the same invoice number if the current-day Sales Day is reopened and the Sale is corrected. A VOIDED Sale never contributes to Load Sheet output.

### 10.3 Sale confirmation execution

```text
HTTP/API adapter
      |
      v
Inbound application port
      |
      v
ConfirmSale use case
      |
      +--> load current Sales Day
      |
      +--> verify Sales Day = OPEN
      |
      +--> load Sale draft
      |
      +--> validate items / quantities
      |
      +--> obtain Catalog price/cost snapshot
      |
      +--> preserve transaction-time itemName
      |
      +--> allocate InvoiceNumber through outbound port
      |
      +--> persist Sale as CONFIRMED
      |
      v
Return Sale + InvoiceNumber
```

The operation must be transactionally designed so a successful confirmation cannot expose a confirmed Sale without its required invoice number.

### 10.4 Load Sheet execution

```text
Closed Sales Day
      |
      v
Query valid confirmed SaleItems
      |
      v
Exclude VOIDED sales
      |
      v
GROUP BY productId
      |
      +--> SUM(quantity)
      +--> SUM(totalPrice)
      +--> SUM(profit)
      |
      v
Resolve Catalog display fields by productId
      |
      v
Return Load Sheet
```

The Load Sheet name is the Catalog product name for the grouped `productId`. A transaction-time `itemName` is intentionally ignored by this aggregation.

### 10.5 Invoice generation and printing

```text
Existing confirmed Sale
      |
      v
Load Sale + Customer + Company data
      |
      v
Render invoice using SaleItem.itemName
      |
      v
Invoice document
      |
      +--> Print individual
      |
      +--> Print in batch
      |
      +--> Reprint
```

No branch in this flow changes the SaleItem name or allocates another invoice number.

## 10. Application Use Cases

Minimum use cases:

### Authentication

- `AuthenticateSeller`
- `LogoutSeller`

### Sales Day

- `GetCurrentSalesDay`
- `OpenCurrentSalesDay`
- `CloseSalesDay`
- `ReopenCurrentSalesDay`

### Customers

- `SearchCustomers`
- `GetCustomer`
- `CreateCustomer`
- `UpdateCustomer`

### Catalog

- `SearchProducts`
- `GetProduct`

### Sales

- `CreateSale`
- `AddSaleItem`
- `UpdateSaleItemQuantity`
- `RemoveSaleItem`
- `ConfirmSale`
- `VoidSale`
- `GetSale`
- `ListSales`

### Fulfillment Output

- `GenerateLoadSheet`
- `ListInvoices`
- `GenerateInvoice`
- `PrintInvoice`
- `PrintInvoiceBatch`

The exact command/query split can evolve without changing the bounded-context model.

## 11. Cross-Context Rules

### Sales -> Customers

Sales stores a stable customer reference. It must not import the `Customer` domain entity.

### Sales -> Catalog

Sales receives the product identity and transaction pricing required for the sale. It must not hold a live dependency on a Catalog ORM entity.

### Sales -> Sales Day

The application layer coordinates whether a sale can be created or modified for a Sales Day. The Sales Day context owns the open/closed rule.

### Fulfillment Output -> Sales

Load Sheet and invoice generation read authorized sale data through explicit application/query contracts. They do not write directly to Sales tables.

## 12. Persistence Rules

ORM entities/models belong exclusively to outbound persistence adapters.

Do not expose ORM models from repositories to application or domain code.

Repositories return domain objects or purpose-specific application projections according to the use case.

Transactions must protect:

- invoice-number allocation;
- sale confirmation;
- logical deletion state changes;
- Sales Day close/reopen transitions.

## 13. API Adapter Rules

HTTP controllers are inbound adapters.

Controllers must:

- authenticate/authorize the request;
- parse and validate transport input;
- invoke an inbound application port/use case;
- map application results to HTTP DTOs;
- map known application/domain errors to HTTP responses.

Controllers must not calculate sale totals, assign invoice numbers, query ORM entities directly, or implement Sales Day invariants.

## 14. Error Model

Business errors must be explicit and stable enough for the frontend to distinguish expected business conditions from technical failures.

Examples:

- `SalesDayNotOpenError`
- `SalesDayCannotBeReopenedError`
- `SaleAlreadyVoidedError`
- `SaleCannotBeModifiedError`
- `SaleMustContainItemsError`
- `InvalidQuantityError`
- `InvoiceNumberAllocationError`
- `CustomerNotFoundError`
- `ProductNotFoundError`

Error names are implementation examples and may be standardized during coding.

## 15. Testing Strategy

### Domain tests

Test aggregates, value objects, calculations, and invariants without HTTP, database, ORM, printer, or framework dependencies.

### Application tests

Test use cases using fake/in-memory ports.

### Adapter tests

Test HTTP mappings, persistence mappings, document rendering, and printer integration independently.

### Integration tests

Verify database transactions, invoice numbering, and cross-context application contracts.

### End-to-end tests

At minimum cover:

1. create customer -> create sale -> confirm sale -> invoice number allocated;
2. create multiple sales -> close Sales Day -> generate Load Sheet;
3. void sale -> regenerate Load Sheet -> voided quantity excluded;
4. close Sales Day -> attempt edit -> rejected;
5. reopen current Sales Day -> edit sale -> regenerate invoice with same invoice number;
6. attempt historical Sales Day reopen -> rejected.

AWS guidance specifically recommends defining domain behavior and testing the core independently from adapters. citeturn0search4

## 16. Backend Folder Structure

```text
src/
  contexts/
    sales/
      domain/
        entities/
        value-objects/
        services/
        events/
        errors/
      application/
        use-cases/
        ports/
          inbound/
          outbound/
        dto/
      adapters/
        inbound/
          http/
        outbound/
          persistence/
      composition/

    sales-day/
      domain/
      application/
      adapters/
      composition/

    customers/
      domain/
      application/
      adapters/
      composition/

    catalog/
      domain/
      application/
      adapters/
      composition/

    fulfillment-output/
      domain/
      application/
      adapters/
        inbound/
          http/
        outbound/
          document-rendering/
          printing/
      composition/

  shared/
    kernel/
```

The abbreviated contexts above must preserve the same internal separation defined for `sales`. No context may bypass another context's boundary because its folders are abbreviated in documentation.

## 17. Shared Kernel

The shared kernel must remain small and domain-neutral. Examples include primitives or cross-cutting technical abstractions that are genuinely shared.

Do not place `Sale`, `Product`, `Customer`, `SalesDay`, or other business aggregates in `shared/kernel`.

## 18. Data Migration

The existing product Excel file is a source for catalog migration. The migration must map the existing columns without silently changing business values.

Required source fields include:

```text
ID ALEGRA
NOMBRE
SUGERIDO
COSTO POR MAYOR
PRECIO POR MAYOR
% GANACIA POR MAYOR
COSTO POR MENOR
PRECIO POR MENOR
% GANACIA POR MENOR
UNIDAES
PACK
ID MARCA
CODIGO
MARCA
```

The migration process must report invalid or duplicate records rather than silently discarding them.

## 19. Non-Functional Requirements

- Online operation is mandatory.
- Backend is authoritative for business rules.
- Invoice numbering must be persistent and transaction-safe.
- Historical sales must preserve transaction-time financial values.
- The application must support responsive clients.
- No device-specific business role is required.
- No offline synchronization is required.

## 20. OQ Register

All OQs in the PDR are binding until resolved. In particular, implementation must not invent invoice-number scope, initial number, printer model, print mechanism, concurrent-session behavior, customer route assignment, or document uniqueness. The product-name behavior is resolved: the seller may customize the sale-item name during order capture, and the stored transaction-time name is used for subsequent outputs.

## 21. Definition of Done

A backend feature is complete only when:

- its business context is identified;
- its use case is defined;
- business rules are implemented in the domain/application core rather than controllers/adapters;
- cross-context dependencies use explicit contracts;
- persistence implementation is isolated in an adapter;
- automated tests cover business behavior;
- API contracts are documented;
- no unrelated context is modified;
- all applicable OQs are resolved or explicitly left blocked.
