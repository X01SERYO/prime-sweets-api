# C4 Architecture — current Core API

This folder is the **only** C4 description of the system. It documents the backend as implemented in this repository.

Version 1 target architecture (bounded contexts `catalog`, `customers`, `sales-day`, `sales`, `fulfillment-output`, hexagonal folder convention, modular monolith) is the decision in [ADR-001](../adrs/ADR-001.md) and the guide in [SPEC](../specs/SPEC.md). It is not duplicated here as a second C4 model.

Canonical domain terms follow the PDR (`Sales Day`, `Sale`, `Load Sheet`, `Customer`, `Catalog`). Current code contexts are `catalog`, `customers`, `sales-day`, `sales`, `fulfillment-output`, and `alegra`.

| Level | Question | Document |
|---|---|---|
| 1 — Context | Who uses the system, and which external systems does it talk to? | [01-context.md](./01-context.md) |
| 2 — Container | Which applications, processes, and stores make it up? | [02-container.md](./02-container.md) |
| 3 — Component | Which modules sit inside the API? | [03-component.md](./03-component.md) |
| 4 — Code | How is the critical implemented flow wired? | [04-code.md](./04-code.md) |

Related: [data model](../data-model/README.md), [flows](../flows/README.md).
