---
name: backend-hexagonal-ddd
description: Estándares y directrices de Arquitectura Hexagonal (Ports & Adapters) y Domain-Driven Design (DDD) para backend en TypeScript/Node.js. Usar al crear, refactorizar o evaluar bounded contexts, entidades de dominio, casos de uso, puertos, repositorios TypeORM, adaptadores HTTP y DTOs.
---

# Estándares de Arquitectura Hexagonal y DDD — Backend

Esta guía establece las directrices arquitectónicas para el desarrollo del backend modular en Node.js y TypeScript, aplicando **Domain-Driven Design (DDD)** y **Arquitectura Hexagonal (Puertos y Adaptadores)**.

---

## 1. Regla de Oro de Dependencias

Las dependencias siempre apuntan hacia adentro:

```text
Adaptadores de Entrada (HTTP / Controllers)
             │
             ▼
      Puertos de Entrada (Interfaces de Use Case / Application)
             │
             ▼
      Casos de Uso (Application Layer)
             │
             ▼
        Modelo de Dominio (Entities, VOs, Domain Errors)
             ▲
             │
      Puertos de Salida (Interfaces de Repositorio / Servicios externos)
             ▲
             │
Adaptadores de Salida (TypeORM, SQL, Clientes HTTP, Mensajería)
```

- **Dominio** es el núcleo puro: **NUNCA** debe importar librerías externas, frameworks, decoradores de TypeORM, Express (`req`, `res`), etc.
- **Aplicación** orquesta el flujo de negocio: solo depende del Dominio y de sus propios Puertos/DTOs.
- **Adaptadores** implementan los detalles tecnológicos e interactúan con la Aplicación mediante Puertos.

---

## 2. Estructura de Directorios por Bounded Context

Cada contexto delimitado vive de forma autocontenida en `src/contexts/<nombre-contexto>/`:

```text
src/contexts/<contexto>/
├── domain/
│   ├── entities/          # Entidades ricas y tipos de primitivos
│   ├── value-objects/     # Objetos de valor inmutables (opcional si la entidad lo requiere)
│   ├── errors/            # Errores de dominio tipados (DomainError)
│   └── events/            # Eventos de dominio (si aplica)
├── application/
│   ├── use-cases/         # Un directorio por caso de uso (ej. createProduct/)
│   │   └── <useCase>/
│   │       ├── <useCase>.useCase.ts
│   │       └── <useCase>.dto.ts
│   └── ports/
│       ├── inbound/       # Interfaces que exponen los casos de uso (opcional si se usa clase directa)
│       └── outbound/      # Interfaces de repositorios y servicios externos requeridos
├── adapters/
│   ├── inbound/
│   │   └── http/          # Rutas Express, controladores y mapeo de requests
│   └── outbound/
│       ├── persistence/   # Repositorios TypeORM / consultas DB
│       └── http/          # Clientes HTTP para APIs externas (ej. Alegra)
└── composition/           # Definición de inyección de dependencias (YAML o código)
```

---

## 3. Capa de Dominio (Domain)

### 3.1 Entidades
- Deben ser ricas en comportamiento (prohibido modelos puramente anémicos cuando existan reglas).
- Proteger las invariantes del negocio en su creación y mutación.
- Utilizar constructor privado/protegido o métodos estáticos `create(...)` para garantizar consistencia.
- Proveer un método `toPrimitives()` y un tipo `EntityPrimitives` para serialización segura hacia afuera.

```typescript
export type ProductPrimitives = {
  id: string;
  name: string;
  wholesalePrice: number;
};

export class Product {
  constructor(
    readonly id: string,
    private _name: string,
    private _wholesalePrice: number
  ) {}

  static create(id: string, name: string, wholesalePrice: number): Product {
    if (!name || name.trim() === '') {
      throw new InvalidProductError('Product name cannot be empty');
    }
    if (wholesalePrice < 0) {
      throw new InvalidProductError('Wholesale price cannot be negative');
    }
    return new Product(id, name.trim(), wholesalePrice);
  }

  update(params: { name?: string; wholesalePrice?: number }): Product {
    const newName = params.name !== undefined ? params.name.trim() : this._name;
    const newPrice = params.wholesalePrice !== undefined ? params.wholesalePrice : this._wholesalePrice;
    return Product.create(this.id, newName, newPrice);
  }

  toPrimitives(): ProductPrimitives {
    return {
      id: this.id,
      name: this._name,
      wholesalePrice: this._wholesalePrice,
    };
  }
}
```

### 3.2 Errores de Dominio
- Cada regla rota debe lanzar o retornar un error de dominio específico que extienda de `Error` o una clase base `DomainError`.
- Evitar errores genéricos como `throw new Error('Algo falló')`.

---

## 4. Capa de Aplicación (Application)

### 4.1 Casos de Uso
- Un caso de uso representa una única acción de negocio / caso de uso del sistema.
- Método de entrada estándar: `run(dto: DTO): Promise<Result<T>>`.
- Orquesta las entidades y los puertos de salida. **No debe incluir lógica de base de datos ni detalles de protocolo HTTP**.
- Manejo de flujo con patrón `Result` (`Result.ok(...)` o `Result.fail(...)`) para errores esperados.

```typescript
export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly alegraSyncService: ProductAlegraSyncService
  ) {}

  async run(dto: UpdateProductDto): Promise<Result<ProductPrimitives>> {
    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail(new ProductNotFoundError(dto.id));
    }

    const updated = product.update({
      name: dto.name,
      wholesalePrice: dto.wholesalePrice,
    });

    await this.productRepository.save(updated);
    await this.alegraSyncService.sync(updated.toPrimitives());

    return Result.ok(updated.toPrimitives());
  }
}
```

### 4.2 Puertos de Salida (Outbound Ports)
- Se definen en `application/ports/outbound/`.
- Son interfaces abstractas en TypeScript.
- Operan únicamente con entidades de dominio o primitivos, jamás con entidades de TypeORM o DTOs de infraestructura.

```typescript
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## 5. Capa de Adaptadores (Adapters)

### 5.1 Adaptadores de Entrada (Inbound / HTTP)
- Son responsables de traducir el protocolo de transporte (Express `Request`, `Response`, query params, headers, body) al DTO del caso de uso.
- Invocan al caso de uso mediante `useCase.run(dto)`.
- Convierten el `Result<T>` retornado en el código de estado HTTP adecuado mediante un helper (ej. `httpResponse(res, result, 201)`).
- **Prohibido colocar lógica de negocio o validaciones de dominio en los controladores**.

### 5.2 Adaptadores de Salida (Outbound / Persistence)
- Implementan los puertos definidos en `application/ports/outbound/`.
- Trabajan con entidades ORM (`ProductEntity`), queries SQL o clientes externos.
- Deben implementar un Mapper bidireccional entre la entidad de dominio pura (`Product`) y la entidad de persistencia (`ProductEntity`).

```typescript
export class TypeOrmProductRepository implements ProductRepository {
  constructor(private readonly repository: Repository<ProductEntity>) {}

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return ProductMapper.toDomain(entity);
  }

  async save(product: Product): Promise<void> {
    const entity = ProductMapper.toEntity(product);
    await this.repository.save(entity);
  }
}
```

---

## 6. Aislamiento entre Bounded Contexts

1. **Prohibido importar entre contextos**:
   - Nunca importar entidades de dominio de otro contexto.
   - Nunca importar repositorios o entidades ORM de otro contexto.
2. **Comunicación intercontexto**:
   - Mediante contratos de aplicación explícitos, eventos de dominio o servicios de aplicación mediadores.
   - Si un contexto necesita datos de otro (ej. `Sales` necesita el nombre de un `Product`), snapshotting o invocación de un puerto/servicio explícito.
