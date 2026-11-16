import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';
import { moneyTransformer } from '@/shared/infrastructure/persistence/typeorm/money.transformer';
import { PurchaseOrderLine } from '@/contexts/purchasing/domain/entities/purchaseOrder';

@Entity('purchase_orders')
@Index('IDX_purchase_orders_supplier_created', ['supplierId', 'createdAt'])
export class PurchaseOrderEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId!: string;

  @Column({ type: 'int', name: 'line_count' })
  lineCount!: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    name: 'total_cost',
    transformer: moneyTransformer
  })
  totalCost!: number;

  @Column({ type: 'jsonb', nullable: true })
  lines!: PurchaseOrderLine[] | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
