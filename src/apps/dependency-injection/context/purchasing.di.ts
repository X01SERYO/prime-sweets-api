import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { CatalogPurchaseProductReader } from '@/apps/dependency-injection/acl/catalogPurchaseProductReader';
import { TypeOrmPurchaseOrderRepository } from '@/contexts/purchasing/adapters/outbound/persistence/repositories/typeOrmPurchaseOrder.repository';
import { TypeOrmSupplierRepository } from '@/contexts/purchasing/adapters/outbound/persistence/repositories/typeOrmSupplier.repository';
import { CreatePurchaseOrderUseCase } from '@/contexts/purchasing/application/use-cases/createPurchaseOrder/createPurchaseOrder.useCase';
import { CreateSupplierUseCase } from '@/contexts/purchasing/application/use-cases/createSupplier/createSupplier.useCase';
import { GetPurchaseOrderUseCase } from '@/contexts/purchasing/application/use-cases/getPurchaseOrder/getPurchaseOrder.useCase';
import { GetSupplierUseCase } from '@/contexts/purchasing/application/use-cases/getSupplier/getSupplier.useCase';
import { ListPurchaseOrdersUseCase } from '@/contexts/purchasing/application/use-cases/listPurchaseOrders/listPurchaseOrders.useCase';
import { ListSuppliersUseCase } from '@/contexts/purchasing/application/use-cases/listSuppliers/listSuppliers.useCase';
import { RenameSupplierUseCase } from '@/contexts/purchasing/application/use-cases/renameSupplier/renameSupplier.useCase';
import { SetSupplierProductsUseCase } from '@/contexts/purchasing/application/use-cases/setSupplierProducts/setSupplierProducts.useCase';

export function registerPurchasingDependencies(container: ContainerBuilder): void {
  const dataSourceRef = new Reference('shared.infrastructure.persistence.typeorm.data_source');
  const productRepoRef = new Reference('catalog.domain.product_repository');
  const idsRef = new Reference('shared.application.id_generator');

  container.register('purchasing.domain.supplier_repository', TypeOrmSupplierRepository).addArgument(dataSourceRef);

  container
    .register('purchasing.domain.purchase_order_repository', TypeOrmPurchaseOrderRepository)
    .addArgument(dataSourceRef);

  container
    .register('purchasing.infrastructure.product_reader', CatalogPurchaseProductReader)
    .addArgument(productRepoRef);

  const suppliersRef = new Reference('purchasing.domain.supplier_repository');
  const ordersRef = new Reference('purchasing.domain.purchase_order_repository');
  const productsRef = new Reference('purchasing.infrastructure.product_reader');

  container.register('purchasing.application.list_suppliers_use_case', ListSuppliersUseCase).addArgument(suppliersRef);

  container
    .register('purchasing.application.create_supplier_use_case', CreateSupplierUseCase)
    .addArgument(suppliersRef)
    .addArgument(idsRef);

  container.register('purchasing.application.rename_supplier_use_case', RenameSupplierUseCase).addArgument(suppliersRef);

  container
    .register('purchasing.application.get_supplier_use_case', GetSupplierUseCase)
    .addArgument(suppliersRef)
    .addArgument(productsRef);

  container
    .register('purchasing.application.set_supplier_products_use_case', SetSupplierProductsUseCase)
    .addArgument(suppliersRef)
    .addArgument(productsRef);

  container
    .register('purchasing.application.create_purchase_order_use_case', CreatePurchaseOrderUseCase)
    .addArgument(suppliersRef)
    .addArgument(ordersRef)
    .addArgument(productsRef)
    .addArgument(idsRef);

  container
    .register('purchasing.application.list_purchase_orders_use_case', ListPurchaseOrdersUseCase)
    .addArgument(ordersRef);

  container
    .register('purchasing.application.get_purchase_order_use_case', GetPurchaseOrderUseCase)
    .addArgument(ordersRef);
}
