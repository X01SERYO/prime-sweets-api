# PDR — Store-to-Store Sales Digitization

**Status:** Proposal
**Language:** English
**Scope:** Version 1
**Document role:** Product design requirement. Business source of truth for Version 1. Not a description of the current API.

## 1. Purpose

This Product Design Requirement (PDR) defines the proposed digitization of the current store-to-store sales process for a confectionery operation in Colombia. The objective is to replace the seller's handwritten order capture and subsequent manual Excel transcription with a single online application that records sales during the store visit and produces the operational outputs required after the sales day is closed.

The proposal deliberately preserves the business rules already used by the operation. It does not introduce inventory management, offline synchronization, device-specific roles, or a replacement commercial process that has not been requested.

## 2. Business Problem

Sellers visit approximately 50 customer stores per route. Today, the seller writes each order manually in a notebook. At the end of the day, the seller manually transcribes the orders into Excel. An Excel macro then processes the information, generates invoices, and produces the daily load sheet. The final Excel processing can take up to two hours.

The principal problem is duplicated data entry: the same sale is captured once during the visit and again later in Excel. This increases operational effort and creates an avoidable opportunity for transcription errors.

## 3. Product Objective

The system shall allow a seller to:

1. authenticate once and maintain a persistent session;
2. work with the current Sales Day;
3. select an existing customer or create a customer when required;
4. create a sale during the store visit;
5. search more than 500 products efficiently by product name, brand, or direct product code;
6. add multiple products and quantities to a sale;
7. use the current wholesale price without allowing the seller to modify it during the sale;
8. confirm the sale and immediately receive a persistent invoice number;
9. continue capturing additional sales without waiting for end-of-day processing;
10. close the Sales Day after confirmation;
11. generate a grouped Load Sheet from the valid sales of the closed Sales Day;
12. generate and print invoices individually or in batch from a PC connected to the existing thermal printer.

## 4. Terminology

| Current business term | Canonical English term | Definition |
|---|---|---|
| Jornada | **Sales Day** | The seller's daily operational sales container. It controls whether its sales are editable and when operational outputs become available. |
| Cargue | **Load Sheet** | The grouped product-level output used for preparing the day's delivery/load. |
| Venta | **Sale** | A commercial transaction containing one or more sale items. |
| Cliente | **Customer** | A store/customer identified by document type, document number, and name. |

The English terms above are the canonical terms for the codebase, API contracts, documentation, and folder names.

## 5. Users and Device Model

There is one application and no special PC profile. The same application can be used from a phone or PC. The phone is the normal capture device during store visits. The PC is the normal environment for later invoice printing because the existing thermal printer is connected to the PC.

No Bluetooth, USB, Wi-Fi, mobile-to-printer integration, or device-specific business role is part of Version 1.

## 6. Connectivity

Internet connectivity is mandatory. Version 1 does not support offline sales, local synchronization, conflict resolution, or offline queues. The backend is the authoritative source for sales, numbering, product pricing, Sales Day state, and derived outputs.

## 7. Sales Day Lifecycle

A Sales Day belongs to a seller and a calendar date and has one of two states:

- `OPEN`
- `CLOSED`

While `OPEN`, the seller can create, edit, and logically delete sales for that Sales Day.

When `CLOSED`:

- sales cannot be edited or deleted;
- Load Sheet generation becomes available;
- invoice generation/printing becomes available;
- sales are treated as operationally locked.

Only the current calendar day's Sales Day may be reopened. Reopening restores editability. Reopening does not create new invoice numbers. Historical Sales Days cannot be reopened.

The close and reopen actions require explicit confirmation because they change the editability state of the day's sales.

## 8. Sale Rules

A sale contains one or more products and quantities.

For every sale item, the system records the applicable wholesale price and wholesale cost as transaction-time snapshots. Historical sales must not change when the catalog price or cost is changed later.

The seller cannot manually change the product price during sale creation.

When a product is added to a sale, the catalog product name is prefilled into the sale item. The seller may immediately edit that sale-item name while taking the order, before the sale is confirmed. This is intended to make order capture easier without losing product identity: the product ID remains the immutable reference to the catalog product. The resulting transaction-time item name is stored with the sale and is used by the invoice only. The Load Sheet is aggregated strictly by `productId`; it does not group by or display the transaction-time item name. The Load Sheet product name comes from the Catalog product identified by that `productId`. There is no separate product-name editing step before invoice generation or printing.

After the sale is confirmed, the transaction-time item name is not editable through the invoice or printing flow. Any later sale correction must not introduce a name-editing step immediately before printing.

The exact business formulas are:

```text
TOTAL PRICE = QUANTITY × WHOLESALE SALE PRICE
PROFIT = TOTAL PRICE − (WHOLESALE COST × QUANTITY)
```

When a sale is confirmed, the system immediately allocates its invoice number for that business date. The visible number is digits only, with at least three places: `001`, `002`, `003`. It has no letters and no prefix. Each new business date starts again at `001`. Within that date the number is not reused, including when a sale is later logically deleted. The database assigns the next value in one atomic update so two confirmations cannot receive the same number. The API chooses the business date and stores the resulting digits on the sale.

A logically deleted sale contributes nothing to the Load Sheet: no quantity, cost, sale amount, or profit.

## 9. Customer Rules

A customer is persisted for recurring use.

Mandatory customer fields:

- document type;
- document number;
- name.

Additional electronic-invoicing fields may be exposed behind a toggle that is OFF by default. Enabling those fields is informational in Version 1 and does not change the current sales process.

No additional mandatory customer information is introduced by this proposal.

## 10. Product Catalog

The current source contains more than 500 products and includes:

- Alegra ID;
- name;
- suggested value;
- wholesale cost;
- wholesale sale price;
- wholesale profit percentage;
- retail cost;
- retail sale price;
- retail profit percentage;
- units;
- pack;
- brand ID;
- code;
- brand.

Version 1 is primarily wholesale. Retail fields remain in the product model because they already exist and may be required by future retail pricing capabilities.

The seller may search by name, brand, or product code. Brand is primarily useful for grouping/filtering. `SUGERIDO` is informational and may be used by future product maintenance logic; it does not allow the seller to alter a sale price.

## 11. Load Sheet

The Load Sheet is a product-level aggregation across all valid sales belonging to the closed Sales Day. Its aggregation identity is the Catalog `productId`, not the transaction-time item name.

Its current columns are:

```text
BRAND | WHOLESALE COST | WHOLESALE SALE PRICE | NAME | QUANTITY | TOTAL PRICE | PROFIT
```

Example: if `productId = 123` is sold as "Green Soda" for 10 units and "Red Soda" for 5 units, the Load Sheet contains one product row for `productId = 123` with quantity 15. The two transaction-time names do not create separate Load Sheet rows.

Cancelled/logically deleted sales contribute zero to the Load Sheet.

Historical Load Sheet persistence is not required by the current business process. The Load Sheet is an operational output for the Sales Day.

## 12. Invoice

The invoice is generated from an existing sale. Generating or regenerating an invoice does not create a sale and does not allocate a new invoice number. An invoice may be printed more than once.

The invoice contains, at minimum:

- company logo;
- company name;
- NIT;
- city and country;
- telephone;
- tax regime text: `Régimen simplificado`;
- customer document and name;
- invoice number;
- sale date;
- product ID;
- product name;
- quantity;
- unit value;
- line total;
- subtotal;
- invoice total;
- the existing legal text supplied by the business.

The invoice uses the transaction-time `itemName` captured on each SaleItem. The product ID remains visible so the item remains unambiguous even when the seller customized the display name. The product table follows the existing Excel invoice structure:

```text
ID | PRODUCT | QTY | UNIT VALUE | TOTAL VALUE
```

The existing thermal-paper width and invoice layout are constraints. Printing uses the Windows print dialog on the PC that already has the thermal printer. The UI owns that dialog, the selection of one invoice, several invoices, or all invoices of the Sales Day, and the page break between invoices. The API supplies the invoice document and does not talk to the printer. Reprinting prints that same document again. Nothing records that an invoice was printed. The Load Sheet is not printed. The printer model is the one already installed in Windows for the current paper roll.

## 13. End-to-End Flow

```text
Seller authenticates
        |
        v
Open/use today's Sales Day
        |
        v
Select or create Customer
        |
        v
Create Sale
        |
        v
Search Product -> enter Quantity -> add items
        |
        v
Review Sale
        |
        v
Confirm Sale -> allocate Invoice Number immediately
        |
        v
Continue with next Customer/Sale
        |
        v
Close Sales Day
        |
        +--> Generate Load Sheet
        |
        +--> Generate/List Invoices
                    |
                    +--> Print individually
                    +--> Print in batch
```

## 14. State Flows

### 14.1 Sales Day state flow

```text
             +------------------+
             |       OPEN       |
             +------------------+
                |            ^
        Close   |            | Reopen
                v            |
             +------------------+
             |      CLOSED      |
             +------------------+

Reopen is allowed only for the current calendar day. Historical Sales Days have no reopen transition.
```

### 14.2 Sale state flow

```text
DRAFT --Confirm--> CONFIRMED --Logical Delete--> VOIDED
  |                    |
  +--Edit--------------+

Edit/confirm/void operations are permitted only while the associated Sales Day is OPEN.
Invoice rendering and reprinting do not change Sale state.
```

### 14.3 Document execution flow

```text
CONFIRMED Sale
    |
    +--> Generate Invoice -> Invoice Document -> Print / Reprint
    |
    +--> Closed Sales Day -> Load Sheet -> Print/consume operationally
```

Neither document operation creates a new Sale or allocates a new invoice number.

## 14. Scope

### In scope

- authentication and persistent seller session;
- current Sales Day lifecycle;
- customer creation and selection;
- product catalog and efficient product search;
- wholesale sale creation;
- multiple sale items;
- transaction price/cost snapshots;
- immediate invoice numbering;
- sale modification and logical deletion while the Sales Day is open;
- current-day Sales Day reopening;
- Load Sheet generation;
- invoice generation;
- invoice listing and printing;
- responsive web interface;
- migration of the current product catalog from Excel through an appropriate migration script/process.

### Out of scope

- inventory management;
- offline mode and synchronization;
- mobile-specific native application;
- device-specific roles;
- Bluetooth/USB/Wi-Fi printer integration;
- changing the current delivery process;
- long-term Load Sheet archival as a business requirement;
- changing the current legal invoice content without business confirmation.

## 15. Architecture Direction

The proposed implementation is a responsive web application backed by a centralized backend and database, initially implemented as a modular monolith.

DDD is used to define business-oriented bounded contexts. Hexagonal Architecture is used inside each bounded context to keep domain/application logic independent from HTTP, persistence, printer technology, and other infrastructure. Current AWS Prescriptive Guidance describes bounded contexts as business-oriented decomposition and ports/adapters as the mechanism for isolating the application core from external components. citeturn0search0turn0search1

The initial bounded contexts are:

1. **Sales**
2. **Sales Day**
3. **Customers**
4. **Catalog**
5. **Fulfillment Output**

These are modules/business boundaries, not automatically separate deployable services.

## 16. Acceptance Criteria

- A seller can create a multi-item sale while the Sales Day is open.
- Product search supports name, brand, and direct code.
- The seller cannot change the catalog wholesale price during sale creation.
- Sale totals use the exact formulas defined in this document.
- Invoice number is allocated at sale confirmation and is not reused after logical deletion.
- Closed Sales Day sales cannot be modified or deleted.
- Current-day reopening restores editability.
- Historical Sales Days cannot be reopened.
- Logical deletions do not contribute to the Load Sheet.
- Load Sheet aggregates identical products across valid sales strictly by `productId`.
- Different transaction-time item names for the same `productId` produce one Load Sheet row.
- Invoice uses the transaction-time `itemName` captured during order entry.
- Invoice regeneration does not create a sale or a new invoice number.
- The same responsive application works on phone and PC.
- Printing uses the Windows print dialog on the PC. The UI prints the invoice document supplied by the API.

## 17. Open Questions and Decisions (OQ Register)

| ID | Question | Current answer/status |
|---|---|---|
| OQ-01 | What is the scope of invoice-number uniqueness? | **ANSWERED.** One sequence per business date for the whole company. The next date starts again at `001`. Within the date the number is not reused. The visible value is digits only (`001`, `002`). The database allocates it atomically. The API selects the business date and stores the digits. |
| OQ-02 | What is the initial invoice number? | **ANSWERED.** Every business date starts at `001`. |
| OQ-03 | What is the exact thermal-printer model? | **ANSWERED for Version 1.** The model stays in the Windows driver already installed on the PC for the current thermal roll. The API does not depend on it. |
| OQ-04 | Should printing be silent/direct or use the standard PC print flow? | **ANSWERED.** Standard Windows print dialog. The UI is responsible. The seller selects the printer, as in the current Excel flow. The API does not send the invoice directly to a printer. |
| OQ-05 | Can the same seller account be active on both phone and PC simultaneously? | **ANSWERED.** Yes. The same account may keep more than one session open, with a maximum of 3 sessions. |
| OQ-06 | Must customers be assigned to sellers/routes? | **ANSWERED.** No for Version 1. A customer belongs to the company. Any seller can use that customer. |
| OQ-07 | Can a customer be created from the sale flow? | **ANSWERED: YES.** The seller can create the customer during the sale visit. The customer remains stored for later sales. |
| OQ-08 | Can the seller change the product name during order capture, and which name is used afterward? | **ANSWERED: YES.** When a product is added to a sale, its catalog name is prefilled and may be changed immediately by the seller. The resulting transaction-time item name is stored with the sale and is used for the invoice only. The product ID remains the product identity. The Load Sheet aggregates strictly by productId and uses Catalog product data for its product name. The item name is not an invoice-stage editing field. |
| OQ-09 | Must customer document number be globally unique? | **ANSWERED: YES.** The same document type and document number identify one customer for the whole company. |
| OQ-10 | Do electronic-invoicing fields change the Version 1 sale process? | **NO.** They are informational only. |
| OQ-11 | Is historical Load Sheet persistence required? | **NO.** Current process does not require it. |
| OQ-12 | Is inventory management required? | **NO.** Out of scope. |
| OQ-13 | Is offline operation required? | **NO.** Internet is mandatory. |
| OQ-14 | Is a separate native mobile application required? | **NO for Version 1.** |
| OQ-15 | Is a separate PC role/profile required? | **NO.** |
| OQ-16 | Is phone-to-printer connectivity required? | **NO.** |
| OQ-17 | Must the Load Sheet be available while the Sales Day is open? | **NO requirement.** Core availability begins after closing. |
| OQ-18 | Can historical Sales Days be reopened? | **NO.** Only the current day's Sales Day may be reopened. |
| OQ-19 | Does reopening allocate a new invoice number? | **NO.** |
| OQ-20 | Does invoice generation create a new sale? | **NO.** |
| OQ-21 | Does reprinting create a new sale? | **NO.** |

## 18. Proposal Outcome

The proposal removes the duplicate manual transcription step while preserving the current commercial rules and physical invoice-delivery workflow. The architecture is intentionally modular and business-oriented so that future capabilities can be introduced without forcing the initial implementation into a microservices topology.
