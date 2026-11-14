import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, Unique, UpdateDateColumn } from 'typeorm';

export type StoredRetailItem = {
  productId: string;
  productCode: string;
  brandName: string;
  productName: string;
  retailPrice: number;
  retailCost: number | null;
  quantity: number;
};

@Entity('retail_days')
@Unique(['businessDate'])
@Index('IDX_retail_days_status_business_date', ['status', 'businessDate'])
export class RetailDayEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'date', name: 'business_date' })
  businessDate!: string;

  @Column({ type: 'varchar', length: 20, default: 'UNREVIEWED' })
  status!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_amount', default: 0 })
  totalAmount!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_profit', default: 0 })
  totalProfit!: string;

  @Column({ type: 'jsonb', name: 'open_items', nullable: true })
  openItems!: StoredRetailItem[] | null;

  @Column({ type: 'timestamptz', name: 'reviewed_at', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'uuid', name: 'reviewed_by', nullable: true })
  reviewedBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
