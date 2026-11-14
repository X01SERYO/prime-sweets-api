import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getAppConfig } from '@shared/infrastructure/config/appConfig';
import { BrandEntity } from '@catalog/adapters/outbound/persistence/entities/brand.entity';
import { ProductEntity } from '@catalog/adapters/outbound/persistence/entities/product.entity';
import { ProductPriceEntity } from '@catalog/adapters/outbound/persistence/entities/productPrice.entity';
import { CustomerEntity } from '@customers/adapters/outbound/persistence/customer.entity';
import { SaleEntity } from '@sales/adapters/outbound/persistence/sale.entity';
import { SaleItemEntity } from '@sales/adapters/outbound/persistence/saleItem.entity';
import { InvoiceSequenceEntity } from '@sales/adapters/outbound/persistence/invoiceSequence.entity';
import { SessionEntity } from '@identity/adapters/outbound/persistence/session.entity';
import { UserEntity } from '@identity/adapters/outbound/persistence/user.entity';

export function createTypeOrmOptions(): DataSourceOptions {
  const config = getAppConfig();

  return {
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    entities: [
      BrandEntity,
      ProductEntity,
      ProductPriceEntity,
      CustomerEntity,
      SaleEntity,
      SaleItemEntity,
      InvoiceSequenceEntity,
      UserEntity,
      SessionEntity
    ],
    migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false
  };
}

export class TypeOrmDataSource extends DataSource {
  constructor() {
    super(createTypeOrmOptions());
  }
}
