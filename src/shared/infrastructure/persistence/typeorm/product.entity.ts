import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { BrandEntity } from './brand.entity';
import { ProductPriceEntity } from './productPrice.entity';
import { moneyTransformer } from './money.transformer';

@Entity('products')
@Unique(['alegraId'])
export class ProductEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'alegra_id', type: 'varchar', length: 64, nullable: false })
  alegraId!: string;

  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId!: string | null;

  @ManyToOne(() => BrandEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand!: BrandEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({
    name: 'suggested_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: moneyTransformer
  })
  suggestedPrice!: number | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  units!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  pack!: number;

  @OneToMany(() => ProductPriceEntity, (price) => price.product, { cascade: true })
  prices!: ProductPriceEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
