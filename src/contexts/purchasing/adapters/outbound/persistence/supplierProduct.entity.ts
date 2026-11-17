import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { moneyTransformer } from '@/shared/infrastructure/persistence/typeorm/money.transformer';
import { SupplierEntity } from './supplier.entity';

@Entity('supplier_products')
export class SupplierProductEntity {
  @PrimaryColumn({ type: 'uuid', name: 'supplier_id' })
  supplierId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => SupplierEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: SupplierEntity;

  @Column({ type: 'int', name: 'previous_quantity', nullable: true })
  previousQuantity!: number | null;

  @Column({ type: 'int', name: 'last_quantity', nullable: true })
  lastQuantity!: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    name: 'last_unit_cost',
    nullable: true,
    transformer: moneyTransformer
  })
  lastUnitCost!: number | null;

  @Column({ type: 'varchar', length: 255, name: 'last_item_name', nullable: true })
  lastItemName!: string | null;
}
