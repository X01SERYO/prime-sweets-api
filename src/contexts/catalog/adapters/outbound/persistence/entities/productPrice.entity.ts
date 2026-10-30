import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { ProductEntity } from './product.entity';
import { moneyTransformer } from '../../../../../../shared/infrastructure/persistence/typeorm/money.transformer';

export type ProductPriceChannelColumn = 'wholesale' | 'retail';

@Entity('product_prices')
@Unique(['productId', 'channel'])
export class ProductPriceEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId!: string;

  @ManyToOne(() => ProductEntity, (product) => product.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @Column({ type: 'varchar', length: 20, nullable: false })
  channel!: ProductPriceChannelColumn;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer
  })
  cost!: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
    transformer: moneyTransformer
  })
  price!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
