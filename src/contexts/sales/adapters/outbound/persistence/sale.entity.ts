import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { SaleItemEntity } from './saleItem.entity';

@Entity('sales')
@Index('IDX_sales_sales_day_id', ['salesDayId'])
@Index('IDX_sales_customer_id', ['customerId'])
@Index('UQ_sales_invoice_business_date_number', ['invoiceBusinessDate', 'invoiceNumber'], { unique: true })
export class SaleEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'uuid', name: 'sales_day_id', nullable: false })
  salesDayId!: string;

  @Column({ type: 'uuid', name: 'customer_id', nullable: false })
  customerId!: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'DRAFT' })
  status!: string;

  @Column({ type: 'varchar', length: 50, name: 'invoice_number', nullable: true })
  invoiceNumber!: string | null;

  @Column({ type: 'varchar', length: 10, name: 'invoice_business_date', nullable: true })
  invoiceBusinessDate!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_amount', default: 0 })
  totalAmount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_profit', default: 0 })
  totalProfit!: number;

  @Column({ type: 'numeric', precision: 14, scale: 3, name: 'total_quantity', default: 0 })
  totalQuantity!: number;

  @Column({ type: 'timestamptz', name: 'confirmed_at', nullable: true })
  confirmedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'voided_at', nullable: true })
  voidedAt!: Date | null;

  @OneToMany(() => SaleItemEntity, (item) => item.sale, { cascade: true, eager: true })
  items!: SaleItemEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
