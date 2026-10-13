import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('sales_days')
@Index('IDX_sales_days_seller_date', ['sellerId', 'date'], { unique: true })
export class SalesDayEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 64, name: 'seller_id', nullable: false })
  sellerId!: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  date!: string;

  @Column({ type: 'varchar', length: 10, nullable: false, default: 'OPEN' })
  status!: string;

  @Column({ type: 'timestamptz', name: 'opened_at', nullable: false })
  openedAt!: Date;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
