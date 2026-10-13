import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { BrandEntity } from './brand.entity';
import { ProductEntity } from './product.entity';
import { ProductPriceEntity } from './productPrice.entity';
import { CustomerEntity } from '../../../../contexts/customers/adapters/outbound/persistence/customer.entity';
import { SalesDayEntity } from '../../../../contexts/sales-day/adapters/outbound/persistence/salesDay.entity';
import { SaleEntity } from '../../../../contexts/sales/adapters/outbound/persistence/sale.entity';
import { SaleItemEntity } from '../../../../contexts/sales/adapters/outbound/persistence/saleItem.entity';
import { InvoiceSequenceEntity } from '../../../../contexts/sales/adapters/outbound/persistence/invoiceSequence.entity';

export function createTypeOrmOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [
      BrandEntity,
      ProductEntity,
      ProductPriceEntity,
      CustomerEntity,
      SalesDayEntity,
      SaleEntity,
      SaleItemEntity,
      InvoiceSequenceEntity
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
