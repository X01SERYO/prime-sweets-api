import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getAppConfig, postgresFromConnectionString } from '@/shared/infrastructure/config/appConfig';
import { BrandEntity } from '@/contexts/catalog/adapters/outbound/persistence/entities/brand.entity';
import { ProductEntity } from '@/contexts/catalog/adapters/outbound/persistence/entities/product.entity';
import { ProductPriceEntity } from '@/contexts/catalog/adapters/outbound/persistence/entities/productPrice.entity';
import { CustomerEntity } from '@/contexts/customers/adapters/outbound/persistence/customer.entity';
import { SaleEntity } from '@/contexts/sales/adapters/outbound/persistence/sale.entity';
import { SaleItemEntity } from '@/contexts/sales/adapters/outbound/persistence/saleItem.entity';
import { InvoiceSequenceEntity } from '@/contexts/sales/adapters/outbound/persistence/invoiceSequence.entity';
import { SessionEntity } from '@/contexts/identity/adapters/outbound/persistence/session.entity';
import { UserEntity } from '@/contexts/identity/adapters/outbound/persistence/user.entity';
import { RetailDayEntity } from '@/contexts/retail-sales/adapters/outbound/persistence/retailDay.entity';
import { SupplierEntity } from '@/contexts/purchasing/adapters/outbound/persistence/supplier.entity';
import { SupplierProductEntity } from '@/contexts/purchasing/adapters/outbound/persistence/supplierProduct.entity';
import { PurchaseOrderEntity } from '@/contexts/purchasing/adapters/outbound/persistence/purchaseOrder.entity';

export function createTypeOrmOptions(connectionString?: string): DataSourceOptions {
  const database = connectionString ? postgresFromConnectionString(connectionString) : getAppConfig().db;

  return {
    type: 'postgres',
    host: database.host,
    port: database.port,
    username: database.user,
    password: database.password,
    database: database.name,
    ssl: database.ssl ? { rejectUnauthorized: false } : false,
    entities: [
      BrandEntity,
      ProductEntity,
      ProductPriceEntity,
      CustomerEntity,
      SaleEntity,
      SaleItemEntity,
      InvoiceSequenceEntity,
      UserEntity,
      SessionEntity,
      RetailDayEntity,
      SupplierEntity,
      SupplierProductEntity,
      PurchaseOrderEntity
    ],
    migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false
  };
}

export class TypeOrmDataSource extends DataSource {
  constructor(connectionString?: string) {
    super(createTypeOrmOptions(connectionString));
  }
}
