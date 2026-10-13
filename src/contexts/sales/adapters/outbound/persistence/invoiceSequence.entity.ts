import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoice_sequences')
export class InvoiceSequenceEntity {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'integer', name: 'current_value', default: 0 })
  currentValue!: number;

  @Column({ type: 'varchar', length: 10, default: 'INV-' })
  prefix!: string;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
