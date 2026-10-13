---
name: frontend-hexagonal-ddd
description: Estándares y directrices de Arquitectura Hexagonal y Domain-Driven Design (DDD) adaptados al Frontend en TypeScript (React / Web / Mobile). Usar al crear, estructurar o refactorizar módulos de cliente, componentes UI, custom hooks, casos de uso, servicios de API y modelos de dominio en el frontend.
---

# Estándares de Arquitectura Hexagonal y DDD — Frontend

Esta guía define las directrices para implementar una arquitectura limpia, desacoplada y basada en el dominio en aplicaciones frontend (React, Next.js, Vite u otras soluciones SPA/móviles).

---

## 1. Mapeo de Conceptos Hexagonales en el Frontend

En el cliente, los roles de la arquitectura hexagonal se distribuyen de la siguiente manera:

```text
    [Usuario / Eventos DOM / Vistas React]  <-- Adaptadores de Entrada (Inbound Adapters)
                        │
                        ▼
           [Custom Hooks / View Models]     <-- Adaptador de Presentación
                        │
                        ▼
      [Casos de Uso (Application Layer)]   <-- TypeScript puro (sin React)
                        │
                        ▼
          [Entidades / Modelos de Dominio]  <-- Núcleo de Dominio puro
                        ▲
                        │
       [Puertos de Salida (API / Storage)]   <-- Interfaces
                        ▲
                        │
 [Fetch / Axios / LocalStorage / Capacitor]  <-- Adaptadores de Salida (Outbound Adapters)
```

- **UI es un detalle reemplazable**: Si cambias de React a Vue o de Tailwind a Material UI, las reglas de negocio y los casos de uso deben permanecer intactos.
- **La API externa es un detalle de infraestructura**: Si la API REST cambia rutas o formato, solo se modifica el adaptador de infraestructura y su mapper, no los componentes.

---

## 2. Estructura de Módulos por Feature

Organizar el frontend por módulos de negocio (features) en lugar de carpetas técnicas globales:

```text
src/modules/<feature>/
├── domain/
│   ├── models/            # Tipos e interfaces del modelo de dominio del cliente
│   ├── value-objects/     # Objetos de valor o validadores puros (ej. Price, Quantity)
│   └── errors/            # Errores específicos del dominio en cliente
├── application/
│   ├── use-cases/         # Funciones o clases que orquestan el flujo de negocio
│   │   ├── getProducts.useCase.ts
│   │   └── updateProduct.useCase.ts
│   └── ports/             # Interfaces de comunicación externa requeridas
│       ├── productApi.port.ts
│       └── productCache.port.ts
├── adapters/
│   ├── ui/                # Componentes React, hooks de presentación y estilos
│   │   ├── components/    # Componentes de presentación (botones, tablas, tarjetas)
│   │   ├── hooks/         # Custom hooks que conectan el estado de React con casos de uso
│   │   └── views/         # Páginas o vistas completas del módulo
│   └── infrastructure/    # Implementaciones concretas de los puertos
│       ├── httpProductApi.ts
│       └── productMapper.ts
```

---

## 3. Capa de Dominio (Domain)

- **Agnóstica de frameworks**: Prohibido importar React (`useState`, `useEffect`, JSX), librerías de UI o dependencias HTTP en esta capa.
- **Modelos claros**: Define el modelo que tu aplicación necesita consumir, no un reflejo crudo e inalterado de los endpoints.
- **Invariantes del cliente**: Reglas inmediatas (ej. cantidad mínima permitida en el carrito, formato monetario o estado de edición temporal).

```typescript
// domain/models/product.model.ts
export interface ProductModel {
  id: string;
  name: string;
  wholesalePrice: number;
  retailPrice: number;
  hasWholesaleDiscount: boolean;
}

// domain/value-objects/price.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
}
```

---

## 4. Capa de Aplicación (Application)

### 4.1 Casos de Uso
- Representan acciones que el usuario o el sistema ejecutan (ej. `GetCatalogUseCase`, `ConfirmSaleUseCase`).
- Son funciones o clases en TypeScript puro que reciben dependencias mediante inyección (inversión de dependencias).
- Retornan datos de dominio o resultados tipados (`Result` / excepciones controladas).

```typescript
// application/use-cases/getProducts.useCase.ts
import { ProductApiPort } from '../ports/productApi.port';
import { ProductModel } from '../../domain/models/product.model';

export class GetProductsUseCase {
  constructor(private readonly api: ProductApiPort) {}

  async execute(): Promise<ProductModel[]> {
    return await this.api.fetchAll();
  }
}
```

### 4.2 Puertos de Salida (Ports)
- Interfaces que declaran qué operaciones necesita la aplicación sin atarse a cómo se implementan.

```typescript
// application/ports/productApi.port.ts
import { ProductModel } from '../../domain/models/product.model';

export interface ProductApiPort {
  fetchAll(): Promise<ProductModel[]>;
  update(id: string, data: Partial<ProductModel>): Promise<ProductModel>;
}
```

---

## 5. Adaptadores de Infraestructura (Outbound Adapters)

- Implementan los puertos usando `fetch`, `axios`, `localStorage`, etc.
- **Mapeo explícito (Mappers)**: Nunca dejes pasar los DTOs crudos del backend directamente a la UI. Mapea de API DTO -> Modelo de Dominio de Frontend.

```typescript
// adapters/infrastructure/httpProductApi.ts
import { ProductApiPort } from '../../application/ports/productApi.port';
import { ProductModel } from '../../domain/models/product.model';
import { ProductMapper } from './productMapper';

export class HttpProductApi implements ProductApiPort {
  constructor(private readonly baseUrl: string) {}

  async fetchAll(): Promise<ProductModel[]> {
    const response = await fetch(`${this.baseUrl}/products`);
    const data = await response.json();
    return data.map(ProductMapper.toDomain);
  }
}
```

---

## 6. Adaptadores de UI (Inbound Adapters & Presentation)

### 6.1 Custom Hooks como Puentes de Presentación
- Los hooks gestionan el estado reactivo de React (`useState`, `useQuery`, estados de carga y error) e invocan a los casos de uso.
- Aislan los componentes de la lógica de orquestación.

```typescript
// adapters/ui/hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { ProductModel } from '../../../domain/models/product.model';
import { GetProductsUseCase } from '../../../application/use-cases/getProducts.useCase';

export function useProducts(getProductsUseCase: GetProductsUseCase) {
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProductsUseCase.execute()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [getProductsUseCase]);

  return { products, loading, error };
}
```

### 6.2 Componentes de Presentación
- Solo se encargan de cómo se ven los datos y de emitir eventos hacia los hooks o props.
- No deben contener `fetch`, cálculos complejos de negocio ni llamadas directas a APIs.

---

## 7. Buenas Prácticas y Reglas Antipatrón

1. ❌ **Antipatrón**: Llamar a `fetch()` o `axios.get()` directamente dentro de `useEffect` en un componente JSX.
   - ✅ **Solución**: Usar un caso de uso que invoque un puerto, consumido a través de un hook.
2. ❌ **Antipatrón**: Acoplar la UI a la estructura cruda de la base de datos o de endpoints ajenos.
   - ✅ **Solución**: Usar `ProductMapper.toDomain(dto)` para que la UI dependa únicamente del modelo de dominio local.
3. ❌ **Antipatrón**: Duplicar en el frontend lógica propietaria del backend que sea crítica y cambiante (ej. cálculo oficial de impuestos o asignación de folios de factura).
   - ✅ **Solución**: El frontend valida para mejorar UX, pero el backend sigue siendo la única fuente de verdad autoritativa para el negocio.
