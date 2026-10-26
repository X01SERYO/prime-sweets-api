import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getAppConfig } from '../../config/appConfig';
import { BrandEntity } from './brand.entity';
import { ProductEntity } from './product.entity';
import { ProductPriceEntity } from './productPrice.entity';
import { CustomerEntity } from '../../../../contexts/customers/adapters/outbound/persistence/customer.entity';
import { SalesDayEntity } from '../../../../contexts/sales-day/adapters/outbound/persistence/salesDay.entity';
import { SaleEntity } from '../../../../contexts/sales/adapters/outbound/persistence/sale.entity';
import { SaleItemEntity } from '../../../../contexts/sales/adapters/outbound/persistence/saleItem.entity';
import { InvoiceSequenceEntity } from '../../../../contexts/sales/adapters/outbound/persistence/invoiceSequence.entity';
import { UserEntity } from '../../../../contexts/identity/adapters/outbound/persistence/user.entity';

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
      SalesDayEntity,
      SaleEntity,
      SaleItemEntity,
      InvoiceSequenceEntity,
      UserEntity
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
