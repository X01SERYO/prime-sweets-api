import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { SaleEntity } from './sale.entity';

@Entity('sale_items')
@Index('IDX_sale_items_sale_id', ['saleId'])
@Index('IDX_sale_items_product_id', ['productId'])
export class SaleItemEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'uuid', name: 'sale_id', nullable: false })
  saleId!: string;

  @Column({ type: 'uuid', name: 'product_id', nullable: false })
  productId!: string;

  @Column({ type: 'varchar', length: 16, name: 'product_code', nullable: false, default: '' })
  productCode!: string;

  @Column({ type: 'varchar', length: 255, name: 'catalog_name', nullable: false, default: '' })
  catalogName!: string;

  @Column({ type: 'varchar', length: 255, name: 'item_name', nullable: false })
  itemName!: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: false })
  quantity!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'wholesale_price', nullable: false })
  wholesalePrice!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'wholesale_cost', nullable: false })
  wholesaleCost!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_price', nullable: false })
  totalPrice!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false })
  profit!: number;

  @ManyToOne(() => SaleEntity, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: SaleEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
